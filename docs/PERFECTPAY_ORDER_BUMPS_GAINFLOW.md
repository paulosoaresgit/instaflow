# GainFlow — Order Bumps na PerfectPay

**Catálogo:** `sales/perfectpay-v3-catalog.json` → `orderBumps`.

**Status:** os dois checkouts individuais foram informados pelo proprietário e registrados no GitHub. A seleção como Order Bump dentro de cada um dos 16 checkouts principais, a configuração de webhooks e os testes de entrega **ainda não foram confirmados**. Não marcar vendas ou entregas como concluídas somente pelo link.

| Item | Produto e plano oficial | Preço USD | Checkout informado | Sales Page |
|---|---|---:|---|---|
| 1 | GainFlow — VIP Express Delivery | 7,00 | https://go.centerpag.com/PPU38CQGT5E | https://instaflow-preview.onrender.com/offer/order-bump-vip-express.html |
| 2 | GainFlow Engagement Toolkit | 9,90 | https://go.centerpag.com/PPU38CQGT6J | https://instaflow-preview.onrender.com/offer/order-bump-engagement-toolkit.html |

## Oferta 1: VIP Express Delivery

**Texto curto (EN):** `Priority processing for your follower order. Add express handling for just $7.00.`

É um serviço de processamento prioritário sujeito a disponibilidade. **Não prometer entrega em 3 horas** sem confirmação técnica de prazo pelo fornecedor e testes reais. Validar o processamento e a associação ao pedido principal antes de ativar.

## Oferta 2: Engagement Toolkit

**Texto curto (EN):** `Get an actionable Reels engagement guide, content templates and a 7-day organic audience plan for only $9.90.`

**Entregável:** arquivo `GainFlow_Engagement_Toolkit.pdf` (3 páginas, inglês): estratégias de Reels, modelos/checklists e plano de ação para engajamento orgânico. **Não inclui** compra de curtidas, salvamentos nem interação artificial. O produto anterior "200 Likes / 200 Likes + 50 Saves" foi substituído; não utilizar sua descrição, entregáveis, promessa ou checkout hipotético. URL antiga `/offer/order-bump-likes-saves.html` redireciona para a nova Sales Page.

## Como configurar na PerfectPay

1. Confira os dois produtos e planos já criados, nomes, moeda USD, valor, entrega e política de garantia. Recupere os códigos reais de **produto** e **plano** e registre-os no catálogo; não invente IDs.
2. Em um checkout principal de teste, abra `Produtos → Meus Produtos → Configuração checkout → editar (lápis) → Ferramentas → Order Bump`.
3. Selecione o primeiro produto e seu plano; preencha os textos e mantenha opcional. Adicione o segundo produto e seu plano. Confira os totais quando ambos estiverem marcados e quando nenhum estiver.
4. Verifique um pedido aprovado com e sem cada item, o webhook, a entrega correta do PDF do Toolkit e a execução do serviço VIP sem duplicações. Valide cancelamento/reembolso.
5. Repita para os 16 checkouts principais, caso tenham configurações separadas. Não ative todos automaticamente sem antes conferir o teste.
6. Os **4 upsells + 1 downsell pós-compra** continuam separados desses dois Order Bumps.

**Documentação PerfectPay:** https://help.perfectpay.com.br/article/151-order-bump

## Checklist

- [ ] Confirmar nomes/preços dos planos na PerfectPay
- [ ] Confirmar fornecedor e SLA do VIP Express Delivery
- [ ] Configurar entrega digital do Engagement Toolkit PDF mediante compra aprovada
- [ ] Associar ambos os Order Bumps aos checkouts elegíveis
- [ ] Verificar o total cobrado e seleção opcional dos dois extras
- [ ] Validar evento de pagamento/webhook e entrega por item
- [ ] Validar compras de teste, reembolsos e suporte
