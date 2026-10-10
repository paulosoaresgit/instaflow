# GainFlow — dois Order Bumps na PerfectPay

**Status: planejados no catálogo, ainda não cadastrados/ativados na conta.**

Essas ofertas são **Order Bumps exibidos no checkout**, não upsells One Click após o pagamento. Não altere os 16 checkouts já cadastrados enquanto não houver produtos/planos e entrega validada. O catálogo central é `sales/perfectpay-v3-catalog.json`, chave `orderBumps`.

| Item | Produto adicional | Plano | Preço em USD | SKU interno |
|---|---|---|---:|---|
| 1 | GainFlow — VIP Express Delivery | VIP Express Delivery | US$ 7,00 | `order-bump-vip-express` |
| 2 | 200 Likes | 200 Likes + 50 Saves | US$ 9,90 | `order-bump-likes-saves` |

## Cópias curtas em inglês

**Bump 1 — VIP Express Delivery**

- Texto de venda: `VIP Express Delivery`
- Texto auxiliar: `Priority processing for your follower order. Add express handling for just $7.00.`
- Referência enviada pelo dono: entrega em 3 horas em vez de 24 horas. **Não publicar esse prazo como garantido até o fornecedor confirmar o serviço e SLA.**

**Bump 2 — 200 Likes + 50 Saves**

- Texto de venda: `200 Likes + 50 Saves`
- Texto auxiliar: `200 likes and 50 saves in total across up to 5 eligible posts. Add for just $9.90.`
- Não alegar garantia de alcance ou melhoria do algoritmo. Confirmar se o fornecedor suporta curtidas e salvamentos em URLs elegíveis; esclarecer que 200+50 são **totais**, não por postagem.

## Etapas dentro da PerfectPay

1. Cadastrar (ou identificar se já existem) os **dois produtos adicionais** e seus planos com valores em USD; manter garantia, suporte e entrega consistentes com os termos e com a capacidade real de atendimento. Produtos adicionais devem representar serviços realmente entregues.
2. Em cada um dos **16 produtos principais**, abrir **Configuração checkout → editar pelo lápis → aba Ferramentas → Order Bump → ativar → Adicionar**.
3. Selecionar **Produto adicional** e o **Plano** correspondente; completar opcionalmente imagem, texto de venda e texto auxiliar conforme as cópias acima.
4. Conferir se ambos aparecem com **checkboxes desmarcados** por padrão, os valores USD 7,00 e USD 9,90, e se o total aumenta corretamente **apenas quando o comprador seleciona**.
5. Validar ao menos um checkout Standard e um Niche; depois percorrer os 16. Verificar imposto/taxa, conversão de moeda, e opções de pagamento. O comprador deve ver claramente o preço adicional e a natureza da entrega.
6. Após pagamento aprovado, o webhook deve identificar **cada item**, relacioná-lo ao pedido principal e entregar cada um **exatamente uma vez**. Não marcar bump como entregue só pela visita à página de obrigado; tratar reembolsos/cancelamentos.
7. Somente então considerar a ativação comercial.

**Documentação oficial:** https://help.perfectpay.com.br/article/151-order-bump e https://help.perfectpay.com.br/article/183-order-bump-o-que-e-como-e-feita-a-cobranca

## Checklist de publicação

- [ ] Fornecedor confirma prazo para entrega prioritária
- [ ] Fornecedor confirma disponibilidade de curtidas e salvamentos e regras de posts
- [ ] Dois produtos/planos adicionais cadastrados e aprovados
- [ ] IDs e códigos reais anotados no catálogo central
- [ ] Ambos vinculados aos 16 checkouts, com verificação de totais
- [ ] Webhook/payment reconciliation validado com itens separados
- [ ] Pedido teste revisado em Standard e Niche
- [ ] Publicação autorizada
