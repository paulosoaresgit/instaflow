# GainFlow - Entregáveis da Fase 1 (novo funil)

Revisão: 2026-10-10.
Repositórios consultados: `paulosoaresgit/instaflow` e `paulosoaresgit/op-global-edu` (Characters School). Para o estúdio, `paulosoaresgit/PersonaLab-AI`.
Status: **materiais digitais criados e verificados visualmente; vendas, entrega e One Click não foram ativados**.

Os dez arquivos foram produzidos como anexos para esta conversa; **os binários PDF, XLSX e ZIP ainda não estão publicados neste repositório GitHub**. Para cadastrar na PerfectPay, usar os PDFs e demais entregáveis disponibilizados no pacote ZIP ao proprietário. Este documento não indica que upload ou entrega automática tenha sido concluído.

## Catálogo de entregáveis

| Ordem | Nome de venda proposto (EN) | Preço proposto USD | Material | Situação |
|---|---|---:|---|---|
| Upsell 1 | Viral Content Factory - 30-Day Reels Kit | 27.00 | `GainFlow_Viral_Content_Factory_30_Day_Kit.pdf` (11 páginas, 30 briefs/roteiros adaptáveis), `GainFlow_Viral_Content_Calendar.xlsx`, `GainFlow_Viral_Content_30_Day_Calendar.csv` | Conteúdo produzido, aguardando entrega integrada |
| Downsell após recusar upsell 1 | Prompt Vault+ - Mini Pack | 9.90 | `GainFlow_Prompt_Vault_Plus_Mini_Pack.pdf` (4 páginas, 18 prompts), `GainFlow_Prompt_Vault_Plus_Editable_Prompts.md` | Conteúdo produzido, aguardando entrega integrada |
| Upsell 2 | PersonaLab AI Studio | 39.97 | `GainFlow_PersonaLab_AI_Studio_Onboarding_Guide.pdf` (4 páginas), `GainFlow_PersonaLab_Creative_Brief_Template.md` | **Somente material de orientação**; painel/acesso GainFlow BLOQUEADO |
| Upsell 3 | Follower Retention Playbook | 19.90 | `GainFlow_Follower_Retention_Playbook.pdf` (5 páginas), `GainFlow_Audience_Tracker.xlsx` | Conteúdo produzido, aguardando entrega integrada |

Os nomes, valores e ordem são propostas de funil ainda sem checkouts e IDs oficiais. Não reutilizar os checkouts em reais da Kiwify (Characters School) para cobrar em dólares no GainFlow.

## Diferenciação do conteúdo

- **Reels Academy** já está incluída no produto principal GainFlow. O Viral Content Factory entrega 30 briefs com hook, sequência visual, legenda, CTA e uma planilha para executar os 30 dias; não são as mesmas aulas.
- **Prompt Vault+** entrega 18 prompts em três frentes (ideação, produção, avaliação), sem duplicar os 30 briefs completos do upsell 1.
- **Follower Retention Playbook** ensina medição e planejamento, contém um tracker com fórmulas para evolução, interações e taxa sobre alcance, sem prometer que seguidores comprados permanecerão ou crescerão.
- **PersonaLab AI** é software com acesso sujeito a direitos do comprador. O PDF é **guia complementar**, não o software. A chave da Higgsfield é individual, e custos externos não estão incluídos.

## Bloqueio específico do PersonaLab

Inspeção read-only em `paulosoaresgit/PersonaLab-AI` (branch principal):

1. `src/main.tsx` importa `./App` e `./styles.css`, mas o diretório `src/` retornado pela API do GitHub contém apenas `main.tsx`; logo, o frontend do repositório, como está, **não pôde ser validado como compilável**. Não confundir com prova de que um eventual site implantado está fora do ar.
2. `supabase/functions/student-studio/index.ts` implementa autenticação, lógica de chaves protegidas e chamadas a modelos de API, mas os direitos reconhecidos incluem o proprietário, matriculados no estúdio e assinaturas `CS-US-STARTER`/`CS-US-PRO`; **compra do GainFlow não aparece autorizada** no código examinado.
3. Antes de comercializar: completar o frontend, criar entitlement por compra GainFlow validada pelo webhook PerfectPay, conferir criptografia e isolamento das chaves, realizar geração de teste com conta autorizada, registrar custos do provedor, aplicar idempotência, revogar por estorno e verificar deploy. Não liberar por e-mail digitado nem URL de obrigado.

## Entrega e ativação - checklist

- [x] PDFs e planilhas de conteúdo gerados
- [x] Inspeção visual das páginas iniciais realizada
- [x] Fórmulas básicas do tracker e suas células vazias verificadas
- [ ] Validar com proprietário nomes e preços comerciais definitivos
- [ ] Cadastrar os quatro produtos/planos extras na PerfectPay e obter códigos oficiais
- [ ] Subir cada arquivo digital no canal de entrega e vincular por item realmente comprado
- [ ] Corrigir e validar acesso PersonaLab para compradores elegíveis do GainFlow
- [ ] Configurar páginas de oferta, caminhos de aceite/recusa, checkout/One Click
- [ ] Configurar/validar webhook, reembolsos, idempotência e entrega real
- [ ] Realizar teste ponta-a-ponta de todas as rotas com cobrança autorizada

**Não realizado nesta etapa:** mudanças nos 16 checkouts principais, ativação dos dois Order Bumps, qualquer cobrança, webhooks em produção ou alterações ao projeto PersonaLab.
