# GainFlow Club — entrega digital de todos os produtos

Atualizado em 09/10/2026. Área de membros construída neste repositório.

## Acessos e dados comerciais

- **Login de alunos (EUA/inglês):** https://instaflow-preview.onrender.com/members/
- **Login de alunos (Brasil/português):** https://instaflow-preview.onrender.com/membros/
- **Suporte:** flowinsta@outlook.com
- **Telefone informado:** 557398289401 (verificar a quantidade de dígitos antes de criar link WhatsApp ou discagem)
- **Garantia:** 7 dias para todos os produtos, conforme as condições de reembolso e de compra
- **Formato PerfectPay:** Produto digital / acesso à área de membros externa
- **Público:** Geral
- **Moeda / pagamento:** USD / cobrança única, mantendo os planos já preparados
- **Entregável base para qualquer compra aprovada:** GainFlow Club, Academia de Reels com 24 aulas em 8 módulos e painel de solicitações ao fornecedor
- **Entregáveis extras:** 5 aulas/recursos independentes, liberados APENAS depois de pagamento aprovado do upsell correspondente.

### Segurança e disponibilidade

Este repositório contém o frontend pronto para visualização e **o backend pronto em código, ainda NÃO conectado a banco nem à PerfectPay**. O arquivo `membros/config.json` está deliberadamente sem chave. Nenhum envio de seguidores pode ser processado apenas com esta página estática. Não publicar o painel como funcional antes de implantar os endpoints, os segredos e a base de dados.

## 1. Criar um Supabase EXCLUSIVO para o GainFlow Club

Não use o projeto FLOW, que estava relacionado ao FlowBridge, nem bancos pertencentes a outros aplicativos. Selecione a organização correta e aprove o custo de criação de um novo projeto no Supabase.

1. Crie um projeto exclusivo (por exemplo, `gainflow-club`).
2. Execute uma única vez o arquivo `database/gainflow_members.sql` usando SQL Editor do projeto, em ambiente apropriado e após revisão do esquema.
3. Confira no SQL Editor: existem as tabelas `gf_orders`, `gf_profiles`, `gf_claims`, `gf_lessons`, `gf_lesson_progress`. As tabelas devem ter RLS ativada e nenhuma permissão ampla de leitura/escrita para os clientes.
4. O curso deve ter **29 aulas (24 principais + 5 extras), em português e inglês**: 24 para qualquer compra e 5 restritas a compras dos upsells. A instrução SQL pode ser reaplicada para atualizar as aulas.
5. Ative autenticação de e-mail por código ou magic link. Configure os Redirect URLs autorizados para `https://instaflow-preview.onrender.com/membros/` e o domínio principal quando publicado.
6. A página `membros/app.js` aceita código por e-mail; personalize o template de OTP para exibir `{{ .Token }}` ou permita o link de login.
7. Obtenha a **URL do projeto** e uma **publishable key** (chave pública). Coloque APENAS esses dois valores em `membros/config.json`; nunca cole `service_role` ou segredo nessa pasta.

## 2. Implantar as Edge Functions do Supabase

Funções armazenadas no repositório:

- `supabase/functions/members-portal/index.ts` — **verify_jwt=true**. Leitura da conta autenticada, plano aprovado, curso, bônus, progresso, vinculação e verificação do @, limite diário 10/15, botão solicitar, ativação de autoenvio.
- `supabase/functions/perfectpay-members-webhook/index.ts` — **verify_jwt=false** APENAS porque valida o token secreto do postback internamente. É invocada pela PerfectPay, não pelo navegador.
- `supabase/functions/members-daily-cron/index.ts` — **verify_jwt=false** APENAS porque valida `x-gf-cron-secret` internamente. Envia automaticamente aos perfis que optaram por receber, estão verificados e têm compra aprovada.

Configure em **Edge Functions → Secrets**:

| Segredo | Propósito |
| --- | --- |
| `GF_PERFECTPAY_POSTBACK_TOKEN` | Token esperado no JSON enviado pela PerfectPay |
| `GF_PERFECTPAY_PRODUCT_MAP` | JSON que associa códigos reais de cada produto/plano a um SKU validado |
| `WORLDSMM_API_KEY` | Chave **secreta** do fornecedor, somente no servidor |
| `WORLDSMM_SERVICE_ID` | ID do serviço de seguidores que foi aprovado no fornecedor; não pressupor que #808 aceite 10/15 |
| `WORLDSMM_MIN_QTY_VERIFIED` | O mínimo testado para esse serviço, necessariamente 10 ou 15 |
| `GF_CRON_SECRET` | Valor longo e aleatório para autenticar disparos automáticos |
| `GF_ALLOWED_ORIGINS` | URLs do site autorizadas, separadas por vírgula |
| `GF_AUTO_MAX_PER_RUN` | Máximo de envios processados por execução (padrão 10) |
| `GF_GLOBAL_DAILY_CAP` | Teto operacional de pedidos/dia do serviço (padrão 300) |

O ambiente Supabase também fornece `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` às funções conforme a configuração do projeto. Não usar uma chave de serviço no navegador nem no GitHub público.

### Exemplo de mapa PerfectPay (dados fictícios)

Cada código de produto/plano da PerfectPay deve ser substituído pelo código REAL recebido após o cadastro. Os nomes exibidos no site nunca autorizam acesso por si só:

```json
{
  "PPL_CODIGO_REAL_STARTER_PADRAO": {
    "sku": "starter-standard",
    "productCode": "PPP_CODIGO_DO_PRODUTO",
    "planCode": "PPL_CODIGO_REAL_STARTER_PADRAO",
    "priceUSD": 14.90
  },
  "PPL_CODIGO_REAL_UPSELL1": {
    "sku": "upsell-1",
    "productCode": "PPP_CODIGO_DO_UPSELL1",
    "planCode": "PPL_CODIGO_REAL_UPSELL1",
    "priceUSD": 39.00
  }
}
```

Cadastrar TODOS os planos normais, nichados e 5 upsells. Para cada produto principal aprovado e cada upsell aprovado, uma linha única aparece em `gf_orders`. Somente `approved` e `completed` do provedor concedem acesso; eventos de reembolso/cancelamento/chargeback revogam o direito daquela compra, sem bloquear outras compras ativas.

## 3. PerfectPay → Área de membros externa

Na PerfectPay, configure **Público Geral**, **Digital**, **Garantia 7 dias**, contato acima e entrega por **Área de Membros Externa / Webhook**.

**URL de entrega digital para EUA:** https://instaflow-preview.onrender.com/members/

**URL de entrega digital para Brasil:** https://instaflow-preview.onrender.com/membros/

**Webhook:** `https://SEU_PROJETO.supabase.co/functions/v1/perfectpay-members-webhook`

Selecione no webhook os eventos de venda aprovada, concluída, devolvida, cancelada e chargeback. O envio deve conter `token`, `code`, `sale_status_enum`, `customer.email`, `product.code` e `plan.code`. A documentação oficial especifica o status 2 como aprovado e 10 como concluído (após 30 dias).

Acesso individual: o aluno faz login com o **mesmo e-mail da compra**, e a consulta no servidor cruza esse e-mail verificado com um pagamento aprovado. Visitar `/obrigado/` NÃO concede acesso.

Atenção: a PerfectPay pode requerer análise prévia do produto. Não classifique apenas como um curso caso esteja vendendo também serviços externos de seguidores; descreva ambos de forma transparente.

## 4. Entrega diária via API e consentimento

- Padrão **10 seguidores/dia** por conta autenticada, administrativamente ajustável a **15**.
- O aluno digita seu @ e opta pela entrega diária automática. Sua conta deve ser validada como pertencente a ele antes de qualquer envio (campo `handle_verified` é falso por padrão).
- Um perfil só recebe um pedido diário; a unicidade fica garantida no PostgreSQL por (`user_id`, `request_day`) em UTC.
- Um pagamento pendente ou reembolsado **não autoriza** envios.
- Após validar que o fornecedor aceita pacotes tão pequenos, configurar o serviço real e os segredos.
- O endpoint checa a quantidade mínima/máxima do serviço diretamente no provedor antes de gastar créditos.
- Em resposta ambígua do provedor, o pedido vai para revisão manual, impedindo duplicidade.
- O recurso automático só deve ser ativado após testar pelo menos um pedido real e confirmar seu status. Não existe entrega garantida se a API recusar ou estiver fora do ar.

**Verificação de titularidade:** requer verificação operacional real do controle sobre o perfil (por exemplo, validação manual ou procedimento documentado de comprovação). Não marque `handle_verified=true` apenas porque o cliente digitou um @.

## 5. Agendamento automático GitHub Actions

Workflow: `.github/workflows/gainflow-daily.yml`. Ele chama o endpoint a cada hora para encontrar alunos elegíveis que ainda não receberam pedido no dia.

Em **GitHub → Settings → Secrets and variables → Actions**, configure:

- `GF_MEMBERS_CRON_URL`: `https://SEU_PROJETO.supabase.co/functions/v1/members-daily-cron`
- `GF_CRON_SECRET`: o mesmo segredo que está armazenado nas Edge Functions

Sem os dois segredos, a action **não envia nada**. Uma execução por hora não implica múltiplas entregas: o banco impede mais de um envio por usuário/dia.

## 6. Fluxos extras e cursos

`upsell-1` (US$39): Account Safety Academy; `downsell-1` (US$19): Essentials; `upsell-2` (US$29.90): Verification Toolkit; `upsell-3` (US$29.90): Advanced Protection; `upsell-4` (US$19.90): Retention Playbook.

O código restringe as aulas de upsell ao SKU da compra aprovada. Os nomes são descritivos e não devem implicar promessa de proteção anti-ban, selo verificado ou retenção garantida.

## Checklist para iniciar vendas

- [ ] Conta Supabase **exclusiva** conectada (URL e publishable key)
- [ ] SQL executado sem erros, aulas presentes, tabelas protegidas por RLS
- [ ] Edge Functions implantadas e tokens/secrets configurados
- [ ] Produtos aprovados na PerfectPay e links dos 21 planos preenchidos
- [ ] Mapeamento de códigos reais da PerfectPay preenchido
- [ ] Teste com compra aprovada e login por e-mail da compra
- [ ] Teste de reembolso revogando apenas o item correspondente
- [ ] Verificação real do controle sobre o @
- [ ] Min/máx 10 ou 15 aceita na API do provedor
- [ ] Teste de um pedido diário + tentativa duplicada bloqueada
- [ ] Agendamento GitHub ativado, sem chaves expostas
- [ ] Contato de suporte e número telefônico testados
- [ ] Curso e upsells revisados para garantir que tudo descrito é entregue

### Fontes técnicas
- PerfectPay Webhook: https://help.perfectpay.com.br/article/597-integracao-via-webhook-com-a-perfect-pay
- PerfectPay entrega externa: https://help.perfectpay.com.br/article/593-como-cadastrar-meu-produto-na-perfect-pay
- API Worldsmm: https://worldsmm.com.br/en/api
- Supabase Auth OTP: https://supabase.com/docs/reference/javascript/auth-verifyotp
- Supabase funções autenticadas: https://supabase.com/docs/guides/functions/auth
