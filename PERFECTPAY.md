# InstaFlow: checkout direto PerfectPay

O InstaFlow está publicado como **site estático no Render**. O checkout funciona diretamente na página: a seleção do plano abre o formulário de @ e e-mail; o navegador carrega `/perfectpay-checkouts.json` e redireciona exclusivamente para o link de checkout cadastrado da PerfectPay.

## Como ativar os planos

No GitHub, branch `main`, edite `perfectpay-checkouts.json` para inserir os links verdadeiros criados em **PerfectPay → Produtos → Meus Produtos → Planos → Links de Checkout**. Não é necessário script, FlowBridge, Whop, token ou API externa. O deploy automático do Render acompanha o commit.

Para cada plano configure `standard` (seguidores gerais) e `niche` (seguidores de nicho): `starter`, `growth`, `pro`, `authority`, `influencer`, `scale`, `dominance`, `ultimate`. Os dois modos podem exigir preços diferentes. Nunca configure o checkout de uma oferta com o preço de outra.

Preços padrão exibidos no site, em USD: Starter $14.90, Growth $29.90, Pro $39.90, Authority $69.90, Influencer $119.90, Scale $199.90, Dominance $299.90, Ultimate $499.90. Cadastre os preços em USD na PerfectPay antes de colar os links. Sem link configurado, o site mostra erro informativo e **não redireciona** para checkout antigo.

A página preserva a coleta do @ e e-mail, preenche o checkout com e-mail/nome quando informado e adiciona parâmetros `src`, `sck`, e UTMs ao link. A referência `sck` inclui plano, modalidade e @ para ajudar a conciliar a venda.

**Limites:** este código configura apenas redirecionamento. Não confirma venda ou entrega seguidores. Para pós-pagamento e upsells, configurar separadamente o webhook de vendas da PerfectPay, com validação e persistência segura, antes de automatizar entrega e acesso. Nem um redirecionamento nem uma página de obrigado equivalem a pagamento aprovado.

O arquivo `server.js` também possui um resolver opcional para implantações Node, mas **não é executado pelo Render estático atual**. A forma ativa da integração é o JSON estático.
