# GainFlow — códigos oficiais da PerfectPay pendentes

**Escopo confirmado em 2026-10-10:** somente compras de produtos GainFlow dão acesso ao GainFlow Club. Outros projetos da mesma conta PerfectPay NÃO têm acesso.

Os códigos `PPU...` dos checkouts NÃO são os códigos oficiais `PPP...` do produto nem `PPL...` do plano. Não adivinhar os códigos ausentes e não ativar processamento automático sem aprovação e testes reais.

## Catálogo consolidado

| Oferta GainFlow | USD | Checkout confirmado | Produto PPP | Plano PPL |
|---|---:|---|---|---|
| GainFlow Starter (starter-standard) | 14.90 | https://go.centerpag.com/PPU38CQGSPG | `PENDENTE` | `PENDENTE` |
| GainFlow Starter Niche (starter-niche) | 22.35 | https://go.centerpag.com/PPU38CQGSPT | `PENDENTE` | `PENDENTE` |
| GainFlow Growth (growth-standard) | 29.90 | https://go.centerpag.com/PPU38CQGSQF | `PENDENTE` | `PENDENTE` |
| GainFlow Growth Niche (growth-niche) | 44.85 | https://go.centerpag.com/PPU38CQGSRU | `PENDENTE` | `PENDENTE` |
| GainFlow Pro (pro-standard) | 39.90 | https://go.centerpag.com/PPU38CQGSUU | `PENDENTE` | `PENDENTE` |
| GainFlow Pro Niche (pro-niche) | 59.85 | https://go.centerpag.com/PPU38CQGT04 | `PENDENTE` | `PENDENTE` |
| GainFlow Authority (authority-standard) | 69.90 | https://go.centerpag.com/PPU38CQGT06 | `PENDENTE` | `PENDENTE` |
| GainFlow Authority Niche (authority-niche) | 104.85 | https://go.centerpag.com/PPU38CQGT09 | `PENDENTE` | `PENDENTE` |
| GainFlow Influencer (influencer-standard) | 119.90 | https://go.centerpag.com/PPU38CQGT1N | `PENDENTE` | `PENDENTE` |
| GainFlow Influencer Niche (influencer-niche) | 179.85 | https://go.centerpag.com/PPU38CQGT1S | `PENDENTE` | `PENDENTE` |
| GainFlow Scale (scale-standard) | 199.90 | https://go.centerpag.com/PPU38CQGT22 | `PENDENTE` | `PENDENTE` |
| GainFlow Scale Niche (scale-niche) | 299.85 | https://go.centerpag.com/PPU38CQGT26 | `PENDENTE` | `PENDENTE` |
| GainFlow Dominance (dominance-standard) | 299.90 | https://go.centerpag.com/PPU38CQGT29 | `PENDENTE` | `PENDENTE` |
| GainFlow Dominance Niche (dominance-niche) | 449.85 | https://go.centerpag.com/PPU38CQGT4B | `PENDENTE` | `PENDENTE` |
| GainFlow Ultimate (ultimate-standard) | 499.90 | https://go.centerpag.com/PPU38CQGT4G | `PENDENTE` | `PENDENTE` |
| GainFlow Ultimate Niche (ultimate-niche) | 749.85 | https://go.centerpag.com/PPU38CQGT54 | `PENDENTE` | `PENDENTE` |
| GainFlow — Viral Content Factory (upsell-1) | 27.00 | https://go.centerpag.com/PPU38CQGTDA | `PENDENTE` | `PENDENTE` |
| GainFlow — Prompt Vault+ (downsell-1) | 9.90 | https://go.centerpag.com/PPU38CQGTDC | `PENDENTE` | `PENDENTE` |
| GainFlow — PersonaLab AI Studio (upsell-2) | 39.97 | https://go.centerpag.com/PPU38CQGTDN | `PPPBFIHF` | `PPLQQQO1M` |
| GainFlow — Follower Retention Playbook (upsell-3) | 19.90 | https://go.centerpag.com/PPU38CQGTDE | `PENDENTE` | `PENDENTE` |
| GainFlow — VIP Express Delivery (order-bump-vip-express) | 7.00 | https://go.centerpag.com/PPU38CQGT5E | `PENDENTE` | `PENDENTE` |
| GainFlow Engagement Toolkit (order-bump-engagement-toolkit) | 9.90 | https://go.centerpag.com/PPU38CQGT6J | `PENDENTE` | `PENDENTE` |

## Registro de compras e segurança

- `public.gf_authorized_plans` no Supabase contém apenas códigos de **produto E plano** confirmados, com SKU único. Atualmente somente `PPPBFIHF` / `PPLQQQO1M` (PersonaLab) está autorizado para reconhecimento quando o webhook for devidamente habilitado.
- Outras compras PerfectPay, mesmo da mesma conta, retornam `202 ignored` e não são gravadas como GainFlow.
- A função `gf_ingest_sale` no banco verifica a tabela de autorização novamente. Clientes não têm INSERT em pedidos, nem podem alterar a tabela de códigos.
- Webhook geral implantado (mas **desligado**): `https://efrgcnlraqrylfvxkstn.supabase.co/functions/v1/perfectpay-members-webhook`.
- Secrets necessários: `GF_PERFECTPAY_POSTBACK_TOKEN` (token **NOVO e rotacionado**, inserir somente no Supabase) e `GF_MEMBERS_WEBHOOK_ENABLED` (`false`/ausente até QA). Não é mais necessário `GF_PERFECTPAY_PRODUCT_MAP`: os pares autorizados vêm exclusivamente do banco.
- Webhook antigo do PersonaLab: `gainflow-perfectpay-webhook` continua isolado e inativo; não ativar simultaneamente sem teste de deduplicação.
- Se a PerfectPay enviar eventos de **39 produtos de vários projetos**, apenas pares desta lista explicitamente autorizados contam. Preferir configurar o webhook da PerfectPay para selecionar apenas os produtos GainFlow, se o painel permitir.
- O cartão PersonaLab inclui materiais que agora são **benefício de qualquer compra GainFlow**. Os demais quatro checkouts de conteúdo foram preservados para auditoria, porém **não promover nem ativar One Click para cobrar os mesmos conteúdos**.
- Não confundir os dois order bumps: Engagement Toolkit é material digital e entra no clube após upload; VIP Express é um serviço de prioridade de processamento e exige pagamento separado e prova da capacidade operacional.

## Como obter os códigos faltantes sem enviar segredos

Na PerfectPay: **Produtos → Meus Produtos → abrir produto** (copiar código `PPP...`) e **Planos → lista** (copiar código `PPL...` do respectivo plano). Envie uma tabela/planilha com esses dois códigos para cada uma das ofertas — nunca chave de API ou token. Valide Starter Niche versus Growth antes de confirmar associação dos planos.

## Testes antes de habilitar

1. Garantir token novo salvo só no Supabase; ativação permanece `false`.
2. Conferir códigos de todos os produtos GainFlow e inserir pares reais na allowlist; validar diferenças entre standard e niche.
3. Verificar no painel a configuração dos eventos Aprovado, Completo, Cancelado, Devolvido e Chargeback.
4. Fazer teste autorizado de compra aprovada, consulta na área de membros, tentativa com produto de outro projeto, compra reembolsada e chegada de eventos duplicados/fora de ordem.
5. Somente depois habilitar `GF_MEMBERS_WEBHOOK_ENABLED=true` e reconferir relatórios; One Click permanece desligado enquanto benefícios incluídos forem apresentados como upsells pagos.
