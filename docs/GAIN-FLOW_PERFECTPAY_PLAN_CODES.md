# GainFlow — inventário de códigos PerfectPay (atualizado)

**Data:** 2026-10-10. Escopo confirmado pelo proprietário: SOMENTE produtos GainFlow autorizam GainFlow Club. Outros projetos desta PerfectPay não são elegíveis.

**Fonte:** 8 imagens de cartões de produtos PerfectPay compartilhadas pelo proprietário + telas anteriores de plano PersonaLab.

- Produtos/planos comerciais no catálogo: **22**
- Códigos de produto PPP registrados sem ambiguidade: **21**
- Códigos PPP que exigem conferência: **1**
- Códigos de plano PPL já confirmados: **2**
- Códigos PPL pendentes: **20**

## Diferença importante encontrada nas fotos

- **Confirmado:** no detalhe do produto `PPPBFIFC`, a PerfectPay mostra **GainFlow Influencer Niche**, plano **Influencer Niche**, preço **US$ 179,85**, código de plano **`PPLQQQNT0`** e o selo do produto **Em análise**. Existe outro cartão chamado Influencer Niche, código **`PPPBFIFF`**, ainda sem identificação conclusiva; ele NÃO foi atribuído ao Scale padrão.
- Nenhum cartão visível foi identificado como **GainFlow Scale** padrão; aparece apenas **GainFlow Scale Niche**, código `PPPBFIFH`.
- **Influencer Niche já está associado a `PPPBFIFC` + `PPLQQQNT0`.** Permanece sem código o **Scale padrão**; não presumir que o cartão `PPPBFIFF` pertence a ele.

## Códigos capturados

| SKU GainFlow | Produto | USD | Código PPP | Código PPL | Checkout |
|---|---|---:|---|---|---|
| `starter-standard` | GainFlow Starter | 14.90 | `PPPBFIEG` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGSPG |
| `starter-niche` | GainFlow Starter Niche | 22.35 | `PPPBFIEJ` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGSPT |
| `growth-standard` | GainFlow Growth | 29.90 | `PPPBFIEL` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGSQF |
| `growth-niche` | GainFlow Growth Niche | 44.85 | `PPPBFIEQ` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGSRU |
| `pro-standard` | GainFlow Pro | 39.90 | `PPPBFIF4` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGSUU |
| `pro-niche` | GainFlow Pro Niche | 59.85 | `PPPBFIF5` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT04 |
| `authority-standard` | GainFlow Authority | 69.90 | `PPPBFIF6` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT06 |
| `authority-niche` | GainFlow Authority Niche | 104.85 | `PPPBFIF7` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT09 |
| `influencer-standard` | GainFlow Influencer | 119.90 | `PPPBFIFA` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT1N |
| `influencer-niche` | GainFlow Influencer Niche | 179.85 | `PPPBFIFC` | `PPLQQQNT0` | https://go.centerpag.com/PPU38CQGT1S |
| `scale-standard` | GainFlow Scale | 199.90 | `**CONFERIR**` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT22 |
| `scale-niche` | GainFlow Scale Niche | 299.85 | `PPPBFIFH` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT26 |
| `dominance-standard` | GainFlow Dominance | 299.90 | `PPPBFIFI` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT29 |
| `dominance-niche` | GainFlow Dominance Niche | 449.85 | `PPPBFIFL` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT4B |
| `ultimate-standard` | GainFlow Ultimate | 499.90 | `PPPBFIFN` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT4G |
| `ultimate-niche` | GainFlow Ultimate Niche | 749.85 | `PPPBFIFS` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT54 |
| `upsell-1` | GainFlow — Viral Content Factory | 27.00 | `PPPBFIHC` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGTDA |
| `downsell-1` | GainFlow — Prompt Vault+ | 9.90 | `PPPBFIHD` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGTDC |
| `upsell-2` | GainFlow — PersonaLab AI Studio | 39.97 | `PPPBFIHF` | `PPLQQQO1M` | https://go.centerpag.com/PPU38CQGTDN |
| `upsell-3` | GainFlow — Follower Retention Playbook | 19.90 | `PPPBFIHE` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGTDE |
| `order-bump-vip-express` | GainFlow — VIP Express Delivery | 7.00 | `PPPBFIG2` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT5E |
| `order-bump-engagement-toolkit` | GainFlow Engagement Toolkit | 9.90 | `PPPBFIG4` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT6J |

## Regra de autorização em produção

- Banco privado `public.gf_authorized_plans` aceita APENAS o par exato `(product_code,plan_code)` com um SKU GainFlow autorizado; a função de registro também verifica a lista.
- Há **dois pares confirmados/autorizados** na allowlist privada: PersonaLab `PPPBFIHF` / `PPLQQQO1M` e Influencer Niche `PPPBFIFC` / `PPLQQQNT0`. O webhook permanece bloqueado até testes.
- O webhook geral permanece **desabilitado**; ter o código `PPP` e um checkout `PPU` nunca equivale a pagamento aprovado nem substitui o `PPL`.
- Outros projetos PerfectPay não serão inseridos na lista de códigos autorizados, mesmo que estejam selecionados no webhook da conta.
- O token compartilhado anteriormente precisa ser rotacionado e guardado apenas no Supabase. Não enviar em capturas ou mensagens.
- Como a biblioteca digital está incluída em qualquer compra GainFlow aprovada, os links de checkout das ofertas digitais antigas NÃO devem ser reativados como upsells dos mesmos materiais.

## Próxima coleta (somente o necessário)

1. Abrir o produto de código `PPPBFIFF` e identificar por que aparece também como **Influencer Niche**; localizar o **GainFlow Scale padrão** se estiver cadastrado. Não renomear/mover planos sem auditar seus links.
2. Para cada item elegível, abrir **Planos** e copiar o código da etiqueta cinza iniciado por `PPL`. Não usar código de afiliação `PPA` nem checkout `PPU`.
3. Após confirmar cada PPP+PPL, inserir o par na allowlist, sem liberar eventos de outros projetos.
4. Configurar e testar webhook com novo token e uma compra autorizada; validar acesso/reembolso antes de ativar cobrança adicional.
