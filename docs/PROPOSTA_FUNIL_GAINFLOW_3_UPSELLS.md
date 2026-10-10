# Proposta revisada — Funil GainFlow com produtos adaptados do Characters School

**Status:** proposta para aprovação. **Não muda** checkouts, rotas, preços ativos, produtos atuais da PerfectPay, scripts ou One Click do GainFlow. Motivo: o proprietário não quer Account Safety como upsell do funil.

## Fontes
- Projeto de origem: `paulosoaresgit/op-global-edu`, docs `docs/kiwify_br_catalog.json` e `docs/CATALOGO_KIWIFY_BR.md`. Nesse catálogo brasileiro existem PersonaLab AI (R$47), Prompt Vault+ (R$19,90), Viral Content Factory (R$37) e MultiPost AI (R$47). Os valores abaixo em dólares são **propostas comerciais novas** para GainFlow, não conversão dos preços BRL, nem preços já cadastrados na PerfectPay.
- GainFlow: `sales/config.json` inclui Reels Academy nas compras principais; `sales/upsell-checkouts.json` ainda tem todos os links vazios; `oneClickEnabled=false`. É preciso evitar entregar/vender novamente algo incluído no plano base.

## Sequência principal recomendada (todos os 16 pacotes)
1. **Pedido principal GainFlow**: checkout PerfectPay da opção Standard ou Niche.
2. **Order Bumps opcionais no checkout**: VIP Express Delivery US$7 (validar fornecimento e prazo) e Engagement Toolkit US$9,90 (PDF educativo). Esses dois itens NÃO são upsells pós-compra; comprovar que foram adicionados à configuração de checkout.
3. **Upsell 1 — Viral Content Factory: 30-Day Reels Kit — US$27,00 (proposta)**.
   - Adaptar do curso de IA para qualquer criador (perfil pessoal, loja, nicho).
   - Entregáveis diferenciados do Reels Academy que já existe: calendário editável de 30 dias, 30 roteiros adaptáveis por nicho, modelos prontos de ganchos/legendas e checklist de produção. Não revender as mesmas aulas já incluídas.
   - Caso recuse, **downsell**: Prompt Vault+ — Hooks & Captions Mini Pack, US$9,90 (proposta), com materiais menores e verificavelmente diferentes.
4. **Upsell 2 — PersonaLab AI: AI Reels Studio — US$39,97 (proposta)**.
   - Ferramenta para gerar personagens e vídeos com IA, inclusive vídeos sem aparecer; útil para quem quer produzir conteúdo novo para o perfil que acabou de adquirir.
   - Deve deixar claro: exige chave pessoal de API de provedor compatível (ex.: Higgsfield); custos de geração, créditos e assinaturas são cobrados pelo provedor separadamente, e a economia não é garantida. Provar que a edição para alunos está publicada e entregue antes de ativar a cobrança.
   - Não forçar o comprador que não precisa de vídeos IA: oferecer recusa clara sem custo e continuar o funil.
5. **Upsell 3 — Follower Retention Playbook — US$19,90 (reutilizar proposta atual)**.
   - Planilhas, checklists e plano de acompanhamento de conteúdo e métricas por 30 dias. Não prometer retenção forçada, blindagem de seguidores ou resultado garantido.
   - É a atual oferta `upsell-4` do GainFlow, movida para a terceira etapa **apenas após aprovação do novo funil**.
6. **Obrigado + acesso à área de membros** após compra confirmada. A navegação por URLs não comprova pagamento.

## Alternativas do Characters School que NÃO recomendo a todos os clientes
- **MultiPost AI — método multiperfis:** útil só a quem gerencia dois ou mais perfis próprios/autorizados; não é software de autopublicação automática. Vender segmentado depois, e não como uma quarta tela obrigatória para todos.
- **30 personagens de IA:** só para compradores que de fato querem criar influenciador de IA; irrelevante à maioria que compra seguidores para perfil existente.
- **50 fórmulas de vídeo:** pode fazer parte do Viral Content Factory ou do downsell Prompt Vault, evitando sobreposição de produtos.

## Diagnóstico / pendências antes da implementação
- Os 16 checkouts principais têm links no GitHub, mas a compra, a entrega e o mapeamento no painel PerfectPay não foram auditados ponta a ponta.
- Os dois Order Bumps têm links próprios registrados, mas a associação nos 16 checkouts precisa ser comprovada.
- Todos os cinco checkouts pós-compra existentes ainda estão vazios e os botões de aceite desabilitados; nenhum One Click foi testado.
- O `sales/config.json` mantém `oneClickEnabled=false`; conferir o bundle principal `assets/index-perfectpay-v4.js`, que contém um caminho acrescentando `upsell=true` independentemente desse controle, antes de ativar.
- Conteúdos do Viral Content Factory, downsell Prompt Vault e PersonaLab AI devem ser produzidos/validados como entregáveis **complementares**, com entitlement por compra e custos de terceiros explícitos.
- A titularidade do domínio `followergrowth.site` em relação ao Render não pôde ser confirmada na inspeção externa atual.
- Divergências entre `baseFollowers + bonusFollowers` e `totalFollowers` dos planos Pro+ também exigem reconciliação.
- Aprovar os preços e a nova sequência com o proprietário **antes** de substituir arquivos de checkout, páginas públicas ou cadastros PerfectPay.

## Experimento
Medir por SKU de entrada, planos Standard/Niche e faixa de valor: taxa de aceite em cada etapa, receita incremental por comprador aprovado, reembolso, chargeback e entrega efetiva. Não afirmar taxa de conversão sem evidência.
