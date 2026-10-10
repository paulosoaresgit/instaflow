import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import net from 'node:net';
import { once } from 'node:events';
import vm from 'node:vm';

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
  assert.equal(Object.values(links).flatMap(Object.values).filter(Boolean).length, 15);
  assert.equal(catalog.checkoutConstraints.linksMissing, 6);
  assert.equal(catalog.products.length, 16);
  assert.equal(catalog.upsells.length, 5);
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

test('all 21 product/extra pages and member/thank-you directory routes serve their own content', async () => {
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

test('all five decline paths retain attribution, omit secrets, and cannot initiate payment', async () => {
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
    assert.equal(element('buy').disabled, true);
    assert.deepEqual(element('buy').listeners, []);
    assert.deepEqual(assignments, []);
  }
});

async function webhookFixture(overrides = {}, mapOverride) {
  const calls = [], logs = [];
  const env = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-only-key', GF_PERFECTPAY_POSTBACK_TOKEN: 'test-only-token',
    GF_PERFECTPAY_PRODUCT_MAP: JSON.stringify(mapOverride || {
      'test-starter-plan': { sku: 'starter-niche', productCode: 'test-product', planCode: 'test-starter-plan' },
      'test-growth-plan': { sku: 'growth-standard', productCode: 'test-product', planCode: 'test-growth-plan' }
    }), ...overrides };
  let handler;
  const source = (await read('supabase/functions/perfectpay-members-webhook/index.ts')).replace(/^import .*;\r?\n/m, '');
  vm.runInNewContext(source, {
    Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } },
    createClient: () => ({ rpc: async (name, args) => { calls.push({ name, args }); return { error: null }; } }),
    Response, TextEncoder, console: { error: value => logs.push(value) }
  });
  const send = async patch => {
    const payload = { token: 'test-only-token', code: 'test-sale', product: { code: 'test-product' }, plan: { code: 'test-starter-plan' }, customer: { email: 'test@example.com' }, sale_status_enum: 2, ...patch };
    const response = await handler(new Request('https://test.invalid/webhook', { method: 'POST', body: JSON.stringify(payload) }));
    return { status: response.status, body: await response.json() };
  };
  return { send, calls, logs };
}

test('approved/completed/refunded/cancelled/chargeback events normalize the official statuses', async () => {
  for (const [code, status] of [[2, 'approved'], [10, 'approved'], [7, 'refunded'], [6, 'cancelled'], [9, 'chargeback']]) {
    const fixture = await webhookFixture();
    assert.equal((await fixture.send({ sale_status_enum: code })).status, 200);
    assert.equal(fixture.calls[0].args.p_status, status);
    assert.equal(fixture.calls[0].args.p_sku, 'starter-niche');
  }
});

test('two plans on the same product map to distinct SKUs and mismatches are rejected', async () => {
  const fixture = await webhookFixture();
  await fixture.send({});
  await fixture.send({ plan: { code: 'test-growth-plan' } });
  assert.equal(fixture.calls[0].args.p_sku, 'starter-niche');
  assert.equal(fixture.calls[1].args.p_sku, 'growth-standard');
  assert.equal((await fixture.send({ product: { code: 'other-product' } })).status, 422);
  assert.equal(fixture.calls.length, 2);
});

test('unauthorized, incomplete, and unknown-status events cannot write membership orders', async () => {
  const fixture = await webhookFixture();
  assert.equal((await fixture.send({ token: 'wrong-token' })).status, 401);
  assert.equal((await fixture.send({ plan: {} })).status, 422);
  assert.equal((await fixture.send({ sale_status_enum: 999 })).status, 422);
  assert.equal((await fixture.send({ sale_status_enum: null })).status, 422);
  assert.equal((await fixture.send({ customer: { email: 'invalid' } })).status, 422);
  assert.deepEqual(fixture.calls, []);
});

test('ambiguous product-only mapping is rejected and an unconfigured project returns 503', async () => {
  const ambiguous = await webhookFixture({}, { 'test-product': { sku: 'growth-standard' } });
  assert.equal((await ambiguous.send({})).status, 503);
  assert.deepEqual(ambiguous.calls, []);
  const missing = await webhookFixture({ SUPABASE_URL: '' });
  assert.equal((await missing.send({})).status, 503);
  assert.deepEqual(missing.calls, []);
});

test('main funnel uses the disabled One Click policy and immutable assets are versioned', async () => {
  assert.equal(config.oneClickEnabled, false);
  const index = await read('index.html');
  assert.ok(index.includes('/assets/index-perfectpay-v5.js'));
  const source = await read('assets/index-perfectpay-v5.js');
  assert.ok(source.includes('if(policy.oneClickEnabled===true)'));
  assert.ok(source.includes('else url.searchParams.delete("upsell")'));
});
