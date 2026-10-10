# GainFlow — Sales Pages do novo funil com IA (Etapa 2)

**Atualização:** 2026-10-10. Código das páginas preparado em `main`. **Cobranças pós-compra e One Click NÃO estão ativados.** Não interpretar visita, clique ou página de obrigado como pagamento aprovado.

## URLs no site de preview Render

| Etapa | Produto em inglês | Valor proposto USD | Página |
|---|---|---:|---|
| Upsell 1 | GainFlow — Viral Content Factory | 27.00 | https://instaflow-preview.onrender.com/offer/upsell-1.html |
| Downsell 1 (se recusar o primeiro) | GainFlow — Prompt Vault+ | 9.90 | https://instaflow-preview.onrender.com/offer/downsell-1.html |
| Upsell 2 | GainFlow — PersonaLab AI Studio | 39.97 | https://instaflow-preview.onrender.com/offer/upsell-2.html |
| Upsell 3 | GainFlow — Follower Retention Playbook | 19.90 | https://instaflow-preview.onrender.com/offer/upsell-3.html |

Para simular contexto de um produto, acrescente `?produto=starter-standard` às páginas. O botão de recusa leva à próxima etapa segundo `sales/config.json`. Esse clique não afirma que a compra anterior foi aprovada.

## Lógica de rotas

1. Checkout original aprovado: apresentar `upsell-1` quando houver integração PerfectPay e confirmação real.
2. Aceitar Upsell 1 (após pagamento verificado no provedor): `upsell-2`; recusar: `downsell-1`.
3. Aceitar ou recusar Downsell: `upsell-2`.
4. Aceitar ou recusar Upsell 2: `upsell-3`.
5. Aceitar ou recusar Upsell 3: `/obrigado/`.
6. `/offer/upsell-4.html` era o endereço antigo do Retention; agora redireciona para `/offer/upsell-3.html` preservando parâmetros.

**ATENÇÃO:** A navegação de recusa está preparada apenas como preview. As transições posteriores a um aceite dependem de configuração real do checkout e dos destinos na PerfectPay, e não do link normal de checkout como se fosse One Click.

## Arquivos alterados e preservados

- Páginas especializadas: `offer/upsell-1.html`, `offer/downsell-1.html`, `offer/upsell-2.html`, `offer/upsell-3.html`.
- Identidade: `sales/upsell-pages.css` (dark theme GainFlow, responsividade e cards de conteúdo).
- `sales/config.json` contém quatro ofertas pós-compra (três upsells e downsell), com valores e passos propostos; `oneClickEnabled: false`.
- `sales/perfectpay-v3-catalog.json` sincronizado, preservando os 16 produtos principais e dois Order Bumps.
- `sales/upsell-checkouts.json` mantém quatro links vazios até obter URLs oficiais PerfectPay.
- `sales/site.js` exige simultaneamente (a) `oneClickEnabled===true`, (b) oferta `active` e (c) URL oficial e válida para tornar clicável o botão de cobrança.
- **NÃO alterados:** `perfectpay-checkouts.json` e os links dos 16 produtos principais, bem como os dois Order Bumps.
- A página principal `assets/index-perfectpay-v4.js` tem caminho legado com `upsell=true`; **auditar antes de ativar One Click**.

## Entregáveis vs compra

- Viral Content Factory: PDF de 30 briefs/roteiros adaptáveis + XLSX/CSV do calendário (preparados na Etapa 1).
- Prompt Vault+: 18 prompts editáveis em PDF + Markdown.
- PersonaLab: guia e briefing preparados, mas **o acesso ao software ainda não está operacional para novos compradores GainFlow**. Não vender como estúdio até completar frontend, entitlements, isolamento de dados, testes e entrega.
- Retention Playbook: PDF + planilha de acompanhamento XLSX. Não prometer retenção garantida.
- Arquivos binários entregáveis estão disponíveis ao proprietário como anexos; **ainda não há upload e associação à entrega automática no servidor**.

## Para ativar depois

1. Revisar e aprovar nomes, USD, garantia e descrições definitivas.
2. Cadastrar os quatro itens como produtos digitais na PerfectPay; guardar códigos oficiais de produto/plano e links de checkout sem inventar IDs.
3. Publicar os entregáveis em área de membros com direito de acesso por produto efetivamente aprovado.
4. Resolver a integração do PersonaLab antes da cobrança do respectivo upsell.
5. Configurar dentro da PerfectPay a sequência do gerador One Click e destinos de aprovação/recusa; validar botão gerado oficialmente, tokens e idempotência.
6. Testar Standard + Niche, aceita/recusa, pagamento, webhooks, reembolso e revogação, além de conferir o total/possíveis impostos.
7. Somente depois liberar e analisar taxas de aceite por etapa e plano, receita líquida, reembolsos e satisfação.
