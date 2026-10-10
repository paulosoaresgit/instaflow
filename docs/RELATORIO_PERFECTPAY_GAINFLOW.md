# GainFlow — relatório PerfectPay

Data: 09/10/2026 — America/Sao_Paulo  
Repositório: paulosoaresgit/instaflow — branch main

**Configuração comercial ainda pendente.** A PerfectPay continua na tela de login com reCAPTCHA. Nenhum produto foi criado, editado, excluído ou duplicado na PerfectPay por esta execução. Não foi realizado pagamento real nem ativado One Click.

## Concluído no código

- Os 15 links principais atualmente registrados foram preservados. O Ultimate de US$ 499,90 entrou na main durante esta execução e foi incorporado sem cadastro duplicado.
- Catálogo reconciliado: 16 produtos principais + 5 adicionais; 15 links registrados e 6 ausentes. Preços conferidos entre catálogo e configuração do site.
- Rotas de cadastro sincronizadas com os links existentes. Códigos oficiais de produto/plano continuam vazios quando não confirmados.
- API Node corrigida para aceitar os links go.centerpag.com e go.perfectpay.com.br já usados no projeto.
- Servidor Node corrigido para servir index.html nos diretórios de membros, obrigado e catálogo. Redirecionamento para barra final preserva os parâmetros.
- Política oneClickEnabled=false aplicada ao funil principal, páginas de oferta e API. Não se acrescenta upsell=true enquanto a política estiver desativada. Novo arquivo JS versionado respeita o cache dos arquivos antigos.
- Recusas dos cinco adicionais preservam produto, UTMs e identificadores permitidos de atribuição. Tokens não são propagados.
- Webhook exige códigos exatos de produto **e** plano; rejeita mapeamento ambíguo, token inválido, dados incompletos e status desconhecido.
- Webhook retorna erro quando não está configurado e não libera acesso. Erros não imprimem credenciais nem dados da venda.

## Inventário comercial

Os preços são os do catálogo, **não conferidos no painel ou na tela de pagamento**. Códigos oficiais de produto e plano não foram confirmados para nenhum dos 21 itens.

| Produto / oferta | USD | Checkout registrado | Situação |
|---|---:|---|---|
| GainFlow Starter | 14.90 | [Checkout](https://go.centerpag.com/PPU38CQGSPG) | Auditoria do painel pendente |
| GainFlow Starter Niche | 22.35 | [Checkout](https://go.centerpag.com/PPU38CQGSPT) | Auditoria do painel pendente |
| GainFlow Growth | 29.90 | [Checkout](https://go.centerpag.com/PPU38CQGSQF) | Auditoria do painel pendente |
| GainFlow Growth Niche | 44.85 | [Checkout](https://go.centerpag.com/PPU38CQGSRU) | Auditoria do painel pendente |
| GainFlow Pro | 39.90 | [Checkout](https://go.centerpag.com/PPU38CQGSUU) | Auditoria do painel pendente |
| GainFlow Pro Niche | 59.85 | [Checkout](https://go.centerpag.com/PPU38CQGT04) | Auditoria do painel pendente |
| GainFlow Authority | 69.90 | [Checkout](https://go.centerpag.com/PPU38CQGT06) | Auditoria do painel pendente |
| GainFlow Authority Niche | 104.85 | [Checkout](https://go.centerpag.com/PPU38CQGT09) | Auditoria do painel pendente |
| GainFlow Influencer | 119.90 | [Checkout](https://go.centerpag.com/PPU38CQGT1N) | Auditoria do painel pendente |
| GainFlow Influencer Niche | 179.85 | [Checkout](https://go.centerpag.com/PPU38CQGT1S) | Auditoria do painel pendente |
| GainFlow Scale | 199.90 | [Checkout](https://go.centerpag.com/PPU38CQGT22) | Auditoria do painel pendente |
| GainFlow Scale Niche | 299.85 | [Checkout](https://go.centerpag.com/PPU38CQGT26) | Auditoria do painel pendente |
| GainFlow Dominance | 299.90 | [Checkout](https://go.centerpag.com/PPU38CQGT29) | Auditoria do painel pendente |
| GainFlow Dominance Niche | 449.85 | [Checkout](https://go.centerpag.com/PPU38CQGT4B) | Auditoria do painel pendente |
| GainFlow Ultimate | 499.90 | [Checkout](https://go.centerpag.com/PPU38CQGT4G) | Auditoria do painel pendente |
| GainFlow Ultimate Niche | 749.85 | — | Verificar antes de cadastrar |
| GainFlow — Account Safety Academy | 39.00 | — | Verificar antes de cadastrar |
| GainFlow — Account Safety Essentials | 19.00 | — | Verificar antes de cadastrar |
| GainFlow — Profile Verification Toolkit | 29.90 | — | Verificar antes de cadastrar |
| GainFlow — Advanced Profile Protection Course | 29.90 | — | Verificar antes de cadastrar |
| GainFlow — Follower Retention Playbook | 19.90 | — | Verificar antes de cadastrar |

## Starter Niche / Growth

A associação incorreta suspeita **não foi confirmada**. O link Starter Niche foi preservado. Nenhum plano foi movido e nenhuma configuração do Growth foi alterada.

Antes de corrigir: registrar código do plano, produto proprietário, preço USD, campanhas e links; mapear todos os usos do link; avaliar impacto antes de transferir ou recriar qualquer plano. A entrega deve mapear produto + plano exatos mesmo se vários planos permanecerem no mesmo produto. Não deduzir identidade por nome ou código de checkout.

## Funil preparado

| Etapa | USD | Após compra aprovada | Recusa |
|---|---:|---|---|
| Produto principal | Catálogo | Upsell 1 | — |
| Account Safety Academy — Upsell 1 | 39.00 | Upsell 2 | Downsell 1 |
| Account Safety Essentials — Downsell 1 | 19.00 | Upsell 2 | Upsell 2 |
| Profile Verification Toolkit — Upsell 2 | 29.90 | Upsell 3 | Upsell 3 |
| Advanced Profile Protection Course — Upsell 3 | 29.90 | Upsell 4 | Upsell 4 |
| Follower Retention Playbook — Upsell 4 | 19.90 | Obrigado | Obrigado |

As cinco páginas de adicionais existem, mas seus checkouts estão vazios e o status continua pending_validation. Botões de aceite continuam desativados. Configuração no painel, botões oficiais e redirecionamentos após pagamento real permanecem pendentes. A validação das recusas não comprova aceite ou pagamento.

## Integração com membros

| Componente | Situação |
|---|---|
| Handler de pagamentos | Código revisado e testado localmente com cliente de banco simulado |
| Status oficiais | 2/10 aprovado, 7 reembolsado, 6 cancelado, 9 chargeback |
| Token de postback | Não obtido/configurado; nenhum segredo publicado |
| Mapa produto + plano | Pendente de códigos oficiais |
| Projeto Supabase GainFlow | Não encontrado nas duas contas conectadas |
| Esquema SQL | Existe em código; não executado nesta sessão |
| Edge Function em produção | Não implantada nesta sessão |
| Webhook no painel PerfectPay | Pendente de login e endpoint real |
| Login dos membros | Páginas disponíveis; conexão do backend ainda vazia |
| Liberação e revogação reais | Não testadas de ponta a ponta |

O SQL existente impede reativar pedidos já reembolsados/cancelados/com chargeback por uma notificação antiga. Essa regra foi revisada no código, **não executada em um banco real**. Ainda é necessário testar duplicidade e eventos fora de ordem.

O projeto FLOW de uma conta conectada pertence a outro aplicativo segundo a documentação do GainFlow. Nenhum banco de outro projeto foi alterado. É necessário definir a conta e o projeto dedicados antes de implantar a entrega automática.

## Checkouts, campanhas e pixels

- Nenhum pixel ou campanha foi criado/alterado na PerfectPay sem identificação confirmada.
- O código existente contém Meta Pixels 2720409015040681 e 1239435449984161 e UTMify 6ab9e9bc09b9d6d6c676f863. Titularidade e associação comercial **não confirmadas**; nenhum desses IDs foi replicado ao painel.
- Confirmar campanhas, token de Conversões quando aplicável, deduplicação e Purchase somente após pagamento aprovado.
- Páginas individuais já tinham botões disabled sem rotina para habilitá-los. Continuam assim até a validação/autorização. O funil principal tem outro caminho para os checkouts existentes.

## Evidências e limites

- **10 testes locais aprovados** com npm test.
- Testes HTTP locais: todas as 21 páginas de produto/oferta; membros, obrigado, redirecionamentos e API de checkout.
- Comparação integral dos 15 links atuais com a main preservada.
- Simulação de todas as recusas: contexto e UTMs preservados; nenhuma requisição de pagamento.
- Webhook simulado: eventos oficiais, planos distintos de um mesmo produto, token inválido, mapeamento ambíguo e configuração ausente.
- Sintaxe JS e diff verificados.
- **39 URLs públicas examinadas:** 21 páginas de produto/oferta + 3 páginas de membros/obrigado responderam com conteúdo esperado. Os 15 checkouts retornaram Site Unavailable neste ambiente, mesmo com HTTP 200. Isso não comprova falha para clientes; nome, preço, moeda e plano continuam sem validação.
- Publicação conferida em seguida, em URLs com versão do commit 6e8ff9d: o site entregou a política oneClickEnabled=false, o index apontando para index-perfectpay-v5.js e o novo arquivo JS. URLs sem versão ainda mostraram conteúdo anterior em cache; aguardar a atualização do cache antes da validação comercial. Isso não comprova que o site execute o servidor Node nem a integração de pagamentos.
- Nenhuma compra real, autorização de cobrança ou ativação One Click foi executada.

## Problemas adicionais

- A contagem anterior de links ausentes e as rotas do catálogo estavam desatualizadas; foram reconciliadas.
- Doze produtos registram divergência entre seguidores anunciados e base + bônus: Pro, Authority, Influencer, Scale, Dominance e Ultimate, nas duas modalidades. Quantidades e promessas não foram alteradas.
- A entrega descrita de 10–15 seguidores/dia precisa ser reconciliada com pacotes anunciados de até 400 mil.
- Serviço/API do fornecedor e quantidade mínima diária não foram validados em produção.
- Suporte, telefone, capa, categoria, entrega externa e garantia precisam de conferência no painel.

## Pendências para terminar

1. Concluir login e reCAPTCHA no navegador desta conversa.
2. Auditar todos os produtos existentes, inclusive Ultimate; obter códigos oficiais de produto e plano.
3. Verificar Starter Niche/Growth e impacto de qualquer correção em links/campanhas.
4. Verificar se Ultimate Niche (US$ 749,85) e os cinco adicionais já existem; cadastrar somente os ausentes pelo catálogo.
5. Concluir suporte, garantia, capa, entrega, campanhas e pixels com identificadores confirmados.
6. Definir o Supabase dedicado; executar esquema, implantar funções e configurar segredos de forma segura.
7. Cadastrar webhook com endpoint real e eventos aprovados, reembolsados e cancelados; incluir concluído e chargeback.
8. Atualizar códigos e novos links no GitHub; testar aceite/recusa, entrega e revogação de acesso de ponta a ponta.
9. Apresentar a configuração validada e obter autorização específica antes de ativar novas cobranças ou One Click.

## Documentação oficial consultada

- [Webhook e status PerfectPay](https://help.perfectpay.com.br/article/597-integracao-via-webhook-com-a-perfect-pay)
- [Cadastro do webhook](https://help.perfectpay.com.br/article/72-como-integrar-via-postback-webhook-com-a-perfect-pay)
- [Upsell One Click](https://help.perfectpay.com.br/article/144-upsell-one-clickbuy)
- [Autenticação Edge Functions](https://supabase.com/docs/guides/functions/auth-headers)

Este relatório é um ponto de continuidade; não certifica os 21 produtos como operacionais.

