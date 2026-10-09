# Funil PerfectPay — páginas de produto e pós-compra

Este projeto contém **16 páginas de produto** (8 planos standard + 8 niche) e **cinco páginas de ofertas adicionais** (4 upsells e 1 downsell), além da página final de obrigado.

## Limitações e status

As páginas são estrutura inicial até recebermos o modelo visual do proprietário. **Checkout desativado** enquanto os links oficiais e serviços oferecidos não forem verificados. Nem a página de obrigado nem os parâmetros de URL constituem confirmação de pagamento. A cobrança One Click só estará operacional após a configuração dentro da PerfectPay e seu teste de pagamentos.

O servidor do projeto atual é estático no Render. Os arquivos de cadastro são:
- `perfectpay-checkouts.json`: links dos 16 produtos principais (campos por plano e modo)
- `sales/upsell-checkouts.json`: links das ofertas extras (por ID)
- `sales/config.json`: preços e descritivos. **Upsells marcados pending_validation** até validar entregáveis e política comercial
- `sales/site.css` e `sales/site.js`: template compartilhado pronto para aplicar a página-modelo quando enviada

## Rotas públicas

- GainFlow Starter: `https://instaflow-preview.onrender.com/p/starter-standard.html`
- GainFlow Starter Niche: `https://instaflow-preview.onrender.com/p/starter-niche.html`
- GainFlow Growth: `https://instaflow-preview.onrender.com/p/growth-standard.html`
- GainFlow Growth Niche: `https://instaflow-preview.onrender.com/p/growth-niche.html`
- GainFlow Pro: `https://instaflow-preview.onrender.com/p/pro-standard.html`
- GainFlow Pro Niche: `https://instaflow-preview.onrender.com/p/pro-niche.html`
- GainFlow Authority: `https://instaflow-preview.onrender.com/p/authority-standard.html`
- GainFlow Authority Niche: `https://instaflow-preview.onrender.com/p/authority-niche.html`
- GainFlow Influencer: `https://instaflow-preview.onrender.com/p/influencer-standard.html`
- GainFlow Influencer Niche: `https://instaflow-preview.onrender.com/p/influencer-niche.html`
- GainFlow Scale: `https://instaflow-preview.onrender.com/p/scale-standard.html`
- GainFlow Scale Niche: `https://instaflow-preview.onrender.com/p/scale-niche.html`
- GainFlow Dominance: `https://instaflow-preview.onrender.com/p/dominance-standard.html`
- GainFlow Dominance Niche: `https://instaflow-preview.onrender.com/p/dominance-niche.html`
- GainFlow Ultimate: `https://instaflow-preview.onrender.com/p/ultimate-standard.html`
- GainFlow Ultimate Niche: `https://instaflow-preview.onrender.com/p/ultimate-niche.html`

## Fluxo de upsell proposto

1. Checkout do produto com `upsell=true` após cadastro dos upsells na PerfectPay
2. Upsell 1: `https://instaflow-preview.onrender.com/offer/upsell-1.html?produto=starter-standard`
3. Se rejeitar Upsell 1, Downsell: `https://instaflow-preview.onrender.com/offer/downsell-1.html?produto=starter-standard`
4. Upsell 2: `https://instaflow-preview.onrender.com/offer/upsell-2.html?produto=starter-standard`
5. Upsell 3: `https://instaflow-preview.onrender.com/offer/upsell-3.html?produto=starter-standard`
6. Upsell 4: `https://instaflow-preview.onrender.com/offer/upsell-4.html?produto=starter-standard`
7. Obrigado final: `https://instaflow-preview.onrender.com/obrigado/?produto=starter-standard`

Troque `starter-standard` pelo slug da oferta correspondente. Você deverá configurar as páginas em cada produto na PerfectPay.

## Cadastro PerfectPay

Segundo o suporte oficial (https://help.perfectpay.com.br/article/144-upsell-one-clickbuy), em **Meus Produtos → Upsell → Configurar Upsell** selecione o produto extra, cole **Link do Upsell** para a próxima página e **Página de Obrigado** para a oferta posterior. Para checkout do produto principal, adicione `upsell=true` ao link; a página criada já faz isso quando encontrar um checkout cadastrado. Para a próxima etapa após recusar, use o link explícito da página. O modelo de One Click e evento de cobrança devem ser testados no painel; **nossa página estática não deve simular cobrança One Click nem liberar entrega sem webhook validado**.

Exemplo: Produto Starter Standard usa primeiro `/offer/upsell-1.html?produto=starter-standard` e no próximo produto configurar `/offer/upsell-2.html?produto=starter-standard` como página de obrigado. Não registre uma página de oferta como pagamento confirmado sem integração.

## Pendências

1. Receber a URL/imagem da página-modelo para adaptar a identidade visual de todas as rotas.
2. Confirmar e-mail de suporte funcional.
3. Reconciliar quantidades anunciadas que divergem de base+bônus para Pro, Authority, Influencer, Scale, Dominance e Ultimate.
4. Revisar promessas antigas sobre banimento, shadowban, prevenção e verificação de conta; não manter alegações sem comprovação.
5. Criar os produtos e ofertas reais na PerfectPay e preencher os checkouts oficiais.
6. Integrar notificações de pagamento aprovado, reembolso e chargeback antes de automatizar entregas e liberações.
7. Publicar o domínio principal separadamente se não estiver servido deste repositório.
