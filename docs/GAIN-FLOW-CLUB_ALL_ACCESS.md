# GainFlow Club — biblioteca única por compra aprovada

**Atualizado em 2026-10-10.** Nova regra solicitada: *uma compra aprovada de qualquer produto GainFlow reconhecido abre todos os conteúdos e ferramentas digitais*. Este documento descreve o estado real, inclusive os bloqueios antes das vendas.

## URLs / frontend

- EN: https://instaflow-preview.onrender.com/members/
- PT-BR: https://instaflow-preview.onrender.com/membros/
- PersonaLab AI: https://personalab-ai-gainflow.vercel.app/
- Repo: `paulosoaresgit/instaflow` no branch `main`.
- Render: static site `instaflow-preview`, auto-deploy; frontend atualizado.
- `membros/config.json` aponta para o Supabase `efrgcnlraqrylfvxkstn`, usando exclusivamente uma chave **pública** publishable. NÃO colocar service_role, tokens de PerfectPay ou Higgsfield no cliente.

## Autorização única

- Supabase: projeto `personalab-ai-alunos` (mesmo Auth do PersonaLab AI; dados do GainFlow isolados em tabelas `gf_*`, com RLS).
- Backend autenticado: `https://efrgcnlraqrylfvxkstn.supabase.co/functions/v1/members-portal`; `verify_jwt=true`. O e-mail é obtido do JWT Supabase **confirmado** no servidor.
- Evidência de compra aprovada por uma das duas fontes:
  1. `public.gf_orders` com `payment_status='approved'` e e-mail do usuário. Essa tabela só é preenchida pelo webhook geral de pagamentos, mediante token e product+plan codes do vendedor.
  2. `public.gf_personalab_orders` com `status='approved'` e mesmo e-mail, gerado pelo webhook isolado PersonaLab mediante validação PerfectPay.
- Qualquer linha aprovada dessas fontes libera curso e biblioteca. Acesso revogado se não restar nenhuma compra aprovada após cancelamento/reembolso/chargeback. Não se concede acesso por visita a página de obrigado, texto digitado, URL do checkout nem afiliação.
- `student-studio` também consulta `gf_orders` e `gf_personalab_orders`, permitindo o PersonaLab a qualquer cliente GainFlow com direito válido; os entitlements originais de Characters School permanecem preservados.

### O que está incluído para qualquer comprador GainFlow autorizado

- Academia de Reels: **24 aulas principais**, armazenadas em `public.gf_lessons` e acessadas apenas pelo endpoint autenticado.
- Viral Content Factory: PDF (30 briefs) + calendário XLSX e CSV.
- Prompt Vault+: PDF (18 prompts) e arquivo Markdown editável.
- Follower Retention Playbook: PDF + planilha XLSX.
- PersonaLab: painel de criação, PDF de início e brief criativo. Exige chave API Higgsfield própria; **créditos/taxas do fornecedor não são incluídos**.
- Os antigos módulos suplementares do curso, com conteúdo Account Safety, foram retirados da visão do novo GainFlow Club, pois são de um funil descontinuado.

### O que NÃO é gratuito/ilimitado por herdar a biblioteca

- Seguidores/daily allocation só podem ser solicitados por cliente de um **plano principal GainFlow** elegível; a ação e o RPC `gf_reserve_daily` exigem SKU do tipo `starter-standard`, `growth-niche`, etc.; provider não configurado = serviço desativado.
- Ter acesso à biblioteca **não eleva** a quantidade de seguidores comprada no checkout.
- As gerações via Higgsfield consomem a chave e créditos próprios do usuário, salvo contratação adicional explícita com termos claros.
- Se o conteúdo compartilhado estiver incluído com qualquer compra, **não cobrar por ele novamente como upsell sem oferecer um benefício distinto**, mesmo que links de checkout antigos continuem registrados.

### Preview do administrador e uploads PersonaLab

- O e-mail confirmado já cadastrado em `student_studio_settings.owner_email` pode entrar no GainFlow Club e **visualizar** aulas/biblioteca, sem criar uma compra fictícia. O acesso administrativo não habilita entregas de seguidores.
- A função `public.student_has_access()` também reconhece compras GainFlow aprovadas e compras PersonaLab verificadas, permitindo que os controles privados de upload/visualização de mídias do PersonaLab respeitem a mesma autorização. Matrículas Characters School antigas continuam válidas.
- O domínio do painel precisa ser autorizado nos Redirect URLs do Supabase Auth; sem isso, o login OTP pode falhar. Essa configuração ainda não foi comprovada.

## Arquivos protegidos

- Bucket privado no mesmo Supabase: `gf-club-files` (public=false, 15 MiB por arquivo). Sem leitura pública ou por usuário direto.
- A Edge Function `members-portal` recebe ação `library_download` com ID de arquivo permitido, exige JWT confirmado e uma compra aprovada, e só então emite uma URL temporária de 120 segundos.
- **FALTA UPLOAD DOS ARQUIVOS:** o bucket existe, mas nenhum arquivo foi carregado pelo ChatGPT nesta etapa; links de download exibem mensagem clara até os arquivos serem enviados.
- O administrador deve enviar os nove arquivos extraídos do ZIP da Etapa 1 para a **raiz** do bucket privado com estes NOMES EXATOS:
  - `GainFlow_Viral_Content_Factory_30_Day_Kit.pdf`
  - `GainFlow_Viral_Content_Calendar.xlsx`
  - `GainFlow_Viral_Content_30_Day_Calendar.csv`
  - `GainFlow_Prompt_Vault_Plus_Mini_Pack.pdf`
  - `GainFlow_Prompt_Vault_Plus_Editable_Prompts.md`
  - `GainFlow_Follower_Retention_Playbook.pdf`
  - `GainFlow_Audience_Tracker.xlsx`
  - `GainFlow_PersonaLab_AI_Studio_Onboarding_Guide.pdf`
  - `GainFlow_PersonaLab_Creative_Brief_Template.md`
- Caminho do painel Supabase: https://supabase.com/dashboard/project/efrgcnlraqrylfvxkstn/storage/buckets/gf-club-files

## Webhooks — DIFERENÇA IMPORTANTE

- `gainflow-perfectpay-webhook`: webhook **isolado** do PersonaLab, existente no Supabase e com `GF_PERSONALAB_WEBHOOK_ENABLED=false` até testes/rotação de token.
- `perfectpay-members-webhook`: webhook **geral** para o GainFlow Club, implantado com `verify_jwt=false` somente porque valida token interno. Está protegido adicionalmente por `GF_MEMBERS_WEBHOOK_ENABLED` (se não for `true`, responde 503). Requer os Secrets `GF_PERFECTPAY_POSTBACK_TOKEN` e `GF_PERFECTPAY_PRODUCT_MAP` com **todos os códigos verdadeiros de produto e plano** permitidos (não usar códigos do checkout PPU e não aceitar produtos desconhecidos).
- URL do webhook geral: `https://efrgcnlraqrylfvxkstn.supabase.co/functions/v1/perfectpay-members-webhook`.
- O produto PersonaLab já tem código de produto `PPPBFIHF`, plano `PPLQQQO1M`, checkout `https://go.centerpag.com/PPU38CQGTDN`. Os demais checkouts estão identificados mas faltam product/plan codes reais para montar o mapa.
- O webhook PerfectPay existente foi visto com **39 produtos / 17 eventos** selecionados. Confirme se a regra comercial abrange *somente produtos GainFlow* ou literalmente **todos os 39 produtos da conta**, inclusive de outros negócios. Não ativar sem essa confirmação; use token rotacionado, pois um token anterior foi compartilhado no chat.
- Enquanto `GF_MEMBERS_WEBHOOK_ENABLED` e `GF_PERSONALAB_WEBHOOK_ENABLED` não estiverem ativados sob supervisão, compras não provisionam automaticamente novas permissões. Não interpretar criação de Edge Function como funcionamento real do pagamento.

## Checklist antes de liberar clientes

- [x] Telas em PT-BR/EN existentes e atualizadas como biblioteca compartilhada.
- [x] Supabase conectado por publishable key e cursos originais sem acesso público.
- [x] 24 aulas principais inseridas no banco protegido.
- [x] Nova Edge Function de membros implantada com login obrigatório.
- [x] PersonaLab reconhece compras GainFlow autorizadas.
- [x] Bucket privado criado e URL temporária para download implementada.
- [ ] Upload dos nove entregáveis no bucket (pelo proprietário).
- [ ] Configurar permissões de redirect do Supabase Auth e testar recebimento de OTP no domínio real.
- [ ] Rotacionar token compartilhado; configurar mapa e segredos do webhook geral e confirmar o escopo comercial.
- [ ] Testar pagamento aprovado no PerfectPay e status real no Supabase.
- [ ] Testar um usuário sem compra, compra cancelada/reembolsada e duas compras com uma estornada.
- [ ] Testar download privado e que URL expira após 120 s.
- [ ] Testar login cruzado e geração real na Higgsfield com usuário que comprou apenas plano GainFlow.
- [ ] Confirmar políticas de inclusão digital nas páginas de venda e revisar One Click, **desativado até teste completo**.

**Não realizado:** envio real de arquivos, venda teste, log-in testado via navegador, ativação do webhook, configuração final da PerfectPay, testes de modelo de IA, nenhuma alteração nos 16 checkouts principais.
