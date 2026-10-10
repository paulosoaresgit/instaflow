import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import net from 'node:net';
import { once } from 'node:events';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { webcrypto } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const catalog = JSON.parse(await read('sales/perfectpay-v3-catalog.json'));
const config = JSON.parse(await read('sales/config.json'));
const links = JSON.parse(await read('perfectpay-checkouts.json'));
let server, origin;

before(async () => {
  const reservation = net.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port), PERFECTPAY_CHECKOUTS_JSON: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('Server did not start')), 10000);
    server.once('error', reject);
    server.once('exit', code => reject(Error(`Server exited: ${code}`)));
    server.stdout.on('data', data => { if (String(data).includes('InstaFlow listening')) { clearTimeout(timeout); resolve(); } });
  });
});
after(() => { server?.kill(); });

test('all previously recorded checkout links are preserved exactly', () => {
  const original = JSON.parse(execFileSync('git', ['show', 'HEAD:perfectpay-checkouts.json'], { cwd: root, encoding: 'utf8' }));
  assert.deepEqual(links, original);
  assert.equal(Object.values(links).flatMap(Object.values).filter(Boolean).length, 16);
  assert.equal(catalog.checkoutConstraints.linksMissing, 0);
  assert.equal(catalog.products.length, 16);
  assert.equal(catalog.upsells.length, 4);
  for (const product of catalog.products) {
    const route = catalog.registrationRoutes.find(r => r.product === product.internalSlug);
    const offer = config.products.find(p => p.id === product.internalSlug);
    assert.equal(route.perfectPayCheckoutUrl, product.liveCheckoutLink);
    assert.equal(product.price, offer.priceUSD);
    assert.equal(route.officialOneClickActivated, false);
    assert.equal(route.checkoutAddParameter, '');
  }
  for (const extra of catalog.upsells) assert.equal(extra.price, config.upsells.find(p => p.slug === extra.internalSlug).priceUSD);
});

test('API accepts all recorded CenterPag links, retains attribution, and keeps One Click disabled', async () => {
  const status = await (await fetch(origin + '/api/perfectpay/status')).json();
  assert.equal(status.oneClickEnabled, false);
  for (const [plan, modes] of Object.entries(links)) {
    for (const [mode, link] of Object.entries(modes)) {
      const response = await fetch(origin + '/api/perfectpay/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, mode, instagramUsername: 'gainflow_test', email: 'test@example.com', tracking: { utm_source: 'test', utm_campaign: 'audit' } })
      });
      assert.equal(response.status, link ? 200 : 503);
      assert.equal(status.plans[plan][mode], Boolean(link));
      if (link) {
        const redirect = new URL((await response.json()).redirectUrl);
        assert.equal(redirect.origin + redirect.pathname, link);
        assert.equal(redirect.searchParams.get('utm_campaign'), 'audit');
        assert.equal(redirect.searchParams.get('email'), 'test@example.com');
        assert.equal(redirect.searchParams.has('upsell'), false);
      }
    }
  }
});

test('all 20 product/extra pages and member/thank-you directory routes serve their own content', async () => {
  for (const product of catalog.products) {
    const response = await fetch(origin + new URL(product.salesPage).pathname);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes(`data-offer="${product.internalSlug}"`));
  }
  for (const extra of catalog.upsells) {
    const response = await fetch(origin + new URL(extra.salesPage).pathname);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes(`data-step="${extra.internalSlug}"`));
  }
  for (const path of ['/members/', '/membros/', '/obrigado/', '/p/', '/p/v3/']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), await read(path.slice(1) + 'index.html'));
    const head = await fetch(origin + path, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  }
});

test('directory redirects retain product context and malformed paths do not stop the server', async () => {
  const response = await fetch(origin + '/obrigado?produto=starter-niche', { redirect: 'manual' });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), '/obrigado/?produto=starter-niche');
  assert.equal((await fetch(origin + '/%ZZ')).status, 400);
  assert.equal((await fetch(origin + '/api/health')).status, 200);
});

test('all four included-offer decline and continue paths retain attribution and cannot initiate payment', async () => {
  const source = await read('sales/site.js');
  for (const offer of config.upsells) {
    const elements = new Map();
    const element = id => {
      if (!elements.has(id)) elements.set(id, { disabled: true, listeners: [], addEventListener: (...args) => elements.get(id).listeners.push(args) });
      return elements.get(id);
    };
    const assignments = [];
    vm.runInNewContext(source, {
      document: { body: { dataset: { kind: 'upsell', step: offer.slug } }, getElementById: element, querySelector: () => null },
      location: { search: '?produto=starter-niche&utm_source=test&utm_campaign=funnel&token=DO_NOT_FORWARD', assign: value => assignments.push(value) },
      fetch: async path => ({ ok: true, json: async () => path === '/sales/config.json' ? config : JSON.parse(await read('sales/upsell-checkouts.json')) }),
      URL, URLSearchParams, Intl, console
    });
    await new Promise(setImmediate);
    const skip = new URL(element('skip').href, origin);
    const expected = offer.decline === 'complete' ? '/obrigado/' : `/offer/${offer.decline}.html`;
    assert.equal(skip.pathname, expected);
    assert.equal(skip.searchParams.get('produto'), 'starter-niche');
    assert.equal(skip.searchParams.get('utm_campaign'), 'funnel');
    assert.equal(skip.searchParams.has('token'), false);
    assert.equal(element('buy').disabled, false);
    assert.equal(element('buy').listeners.length, 1);
    assert.deepEqual(assignments, []);
    const clickHandler = element('buy').listeners[0][1];
    clickHandler();
    assert.equal(assignments.length, 1);
    const nextUrl = new URL(assignments[0], origin);
    assert.equal(nextUrl.pathname, offer.next === 'complete' ? '/obrigado/' : `/offer/${offer.next}.html`);
    assert.equal(nextUrl.searchParams.get('produto'), 'starter-niche');
    assert.equal(nextUrl.searchParams.get('utm_campaign'), 'funnel');
    assert.equal(nextUrl.searchParams.has('token'), false);
    assert.equal(nextUrl.origin, origin);
  }
});

async function webhookFixture(overrides = {}, mapOverride) {
  const calls = [], mapQueries = [];
  const env = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-only-key',
    GF_MEMBERS_WEBHOOK_ENABLED: 'true',
    GF_PERFECTPAY_POSTBACK_TOKEN: 'a-long-test-token-123456',
    ...overrides
  };
  const authorizedPairs = mapOverride || {
    'test-product:test-starter-plan': 'starter-niche',
    'test-product:test-growth-plan': 'growth-standard'
  };
  let handler;
  const ts = (await read('supabase/functions/perfectpay-members-webhook/index.ts'))
    .replace(/^import .*;\r?\n/m, '');
  const source = stripTypeScriptTypes(ts, { mode: 'strip' });
  const createClient = () => ({
    from: table => {
      const conditions = {};
      const query = {
        select: () => query,
        eq: (key, value) => { conditions[key] = value; return query; },
        maybeSingle: async () => {
          mapQueries.push({ table, conditions: { ...conditions } });
          const sku = table === 'gf_authorized_plans' && conditions.is_active === true
            ? authorizedPairs[conditions.product_code + ':' + conditions.plan_code] : null;
          return { data: sku ? { sku } : null, error: null };
        }
      };
      return query;
    },
    rpc: async (name, args) => { calls.push({ name, args }); return { error: null }; }
  });
  vm.runInNewContext(source, {
    Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } },
    createClient, crypto: webcrypto, Response, TextEncoder, Uint8Array, console
  });
  const send = async patch => {
    const payload = {
      token: 'a-long-test-token-123456',
      code: 'test-sale-0001',
      product: { code: 'test-product' },
      plan: { code: 'test-starter-plan' },
      customer: { email: 'test@example.com' },
      sale_status_enum: 2, ...patch
    };
    const response = await handler(new Request('https://test.invalid/webhook', {
      method: 'POST', body: JSON.stringify(payload)
    }));
    return { status: response.status, body: await response.json() };
  };
  return { send, calls, mapQueries };
}

test('approved/completed/refunded/cancelled/chargeback events map to official statuses', async () => {
  for (const [code, status] of [[2, 'approved'], [10, 'approved'], [7, 'refunded'], [6, 'cancelled'], [9, 'chargeback']]) {
    const fixture = await webhookFixture();
    assert.equal((await fixture.send({ sale_status_enum: code })).status, 200);
    assert.equal(fixture.calls[0].args.p_status, status);
    assert.equal(fixture.calls[0].args.p_sku, 'starter-niche');
    assert.equal(fixture.calls[0].name, 'gf_ingest_sale');
  }
});

test('different verified plan pairs map to distinct SKUs; unknown pairs never grant access', async () => {
  const fixture = await webhookFixture();
  await fixture.send({});
  await fixture.send({ plan: { code: 'test-growth-plan' } });
  assert.equal(fixture.calls[0].args.p_sku, 'starter-niche');
  assert.equal(fixture.calls[1].args.p_sku, 'growth-standard');
  const unknown = await fixture.send({ product: { code: 'other-product' } });
  assert.equal(unknown.status, 202);
  assert.equal(unknown.body.ignored, true);
  assert.equal(fixture.calls.length, 2);
  assert.ok(fixture.mapQueries.every(q => q.table === 'gf_authorized_plans'));
});

test('unauthorized and incomplete webhooks cannot write membership orders', async () => {
  const fixture = await webhookFixture();
  assert.equal((await fixture.send({ token: 'wrong-token' })).status, 401);
  assert.equal((await fixture.send({ plan: {} })).status, 422);
  assert.equal((await fixture.send({ sale_status_enum: 999 })).status, 202);
  assert.equal((await fixture.send({ sale_status_enum: null })).status, 422);
  assert.equal((await fixture.send({ customer: { email: 'invalid' } })).status, 422);
  assert.deepEqual(fixture.calls, []);
});

test('product-only mapping is not enough; missing configuration or disabled webhook blocks access', async () => {
  const productOnly = await webhookFixture({}, { 'test-product': 'growth-standard' });
  const unapproved = await productOnly.send({});
  assert.equal(unapproved.status, 202);
  assert.deepEqual(productOnly.calls, []);
  const missing = await webhookFixture({ SUPABASE_URL: '' });
  assert.equal((await missing.send({})).status, 503);
  const disabled = await webhookFixture({ GF_MEMBERS_WEBHOOK_ENABLED: 'false' });
  assert.equal((await disabled.send({})).status, 503);
});

test('all included offers stay non-charging and the front One Click policy remains disabled', async () => {
  assert.equal(links.scale.standard, 'https://go.centerpag.com/PPU38CQGTET');
  assert.equal(catalog.registrationRoutes.find(p => p.product === 'scale-standard')?.perfectPayCheckoutUrl, links.scale.standard);
  assert.equal(config.membershipAccessPolicy.grantsDigitalLibraryAfterAnyApprovedGainFlowPurchase, true);
  for (const offer of config.upsells) {
    const html = await read(`offer/${offer.slug}.html`);
    assert.ok(html.includes('GAINFLOW CLUB — ALREADY INCLUDED'));
    assert.ok(!html.includes('EXCLUSIVE OPTIONAL ADD-ON'));
  }
  assert.equal(config.oneClickEnabled, false);
  const index = await read('index.html');
  assert.ok(index.includes('/assets/index-perfectpay-v5.js'));
  const source = await read('assets/index-perfectpay-v5.js');
  assert.ok(source.includes('if(policy.oneClickEnabled===true)'));
  assert.ok(source.includes('else url.searchParams.delete("upsell")'));
});
