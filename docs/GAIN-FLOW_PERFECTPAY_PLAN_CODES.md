# GainFlow — inventário de códigos PerfectPay (atualizado)

**Data:** 2026-10-10. Escopo confirmado pelo proprietário: SOMENTE produtos GainFlow autorizam GainFlow Club. Outros projetos desta PerfectPay não são elegíveis.

**Fonte:** 8 imagens de cartões de produtos PerfectPay compartilhadas pelo proprietário + telas anteriores de plano PersonaLab.

- Produtos/planos comerciais no catálogo: **22**
- Códigos de produto PPP registrados sem ambiguidade: **20**
- Códigos PPP que exigem conferência: **2**
- Códigos de plano PPL já confirmados: **1**
- Códigos PPL pendentes: **21**

## Diferença importante encontrada nas fotos

- Dois cartões distintos aparecem com o mesmo título **GainFlow Influencer Niche**, mas com códigos **`PPPBFIFF`** e **`PPPBFIFC`**.
- Nenhum cartão visível foi identificado como **GainFlow Scale** padrão; aparece apenas **GainFlow Scale Niche**, código `PPPBFIFH`.
- Não é seguro presumir qual código pertence ao **Influencer Niche** verdadeiro e qual seria o **Scale** padrão; ambas as associações estão propositalmente vazias no catálogo até o proprietário confirmar.

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
| `influencer-niche` | GainFlow Influencer Niche | 179.85 | `**CONFERIR**` | `**PENDENTE**` | https://go.centerpag.com/PPU38CQGT1S |
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
- Só está confirmado e autorizado até agora o par PersonaLab `PPPBFIHF` / `PPLQQQO1M`.
- O webhook geral permanece **desabilitado**; ter o código `PPP` e um checkout `PPU` nunca equivale a pagamento aprovado nem substitui o `PPL`.
- Outros projetos PerfectPay não serão inseridos na lista de códigos autorizados, mesmo que estejam selecionados no webhook da conta.
- O token compartilhado anteriormente precisa ser rotacionado e guardado apenas no Supabase. Não enviar em capturas ou mensagens.
- Como a biblioteca digital está incluída em qualquer compra GainFlow aprovada, os links de checkout das ofertas digitais antigas NÃO devem ser reativados como upsells dos mesmos materiais.

## Próxima coleta (somente o necessário)

1. Confirmar por **Detalhes** qual produto corresponde a `PPPBFIFF` e qual corresponde a `PPPBFIFC`, e localizar o **Scale** padrão.
2. Para cada item elegível, abrir **Planos** e copiar o código da etiqueta cinza iniciado por `PPL`. Não usar código de afiliação `PPA` nem checkout `PPU`.
3. Após confirmar cada PPP+PPL, inserir o par na allowlist, sem liberar eventos de outros projetos.
4. Configurar e testar webhook com novo token e uma compra autorizada; validar acesso/reembolso antes de ativar cobrança adicional.
