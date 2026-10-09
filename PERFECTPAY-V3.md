# Insta Gain Flow V3 — replicação preparada para PerfectPay

**Referência informada:** https://instagainflow.com/v3/?front=v3&lang=en

> Verificação: a página original não pôde ser aberta nesta sessão. O catálogo abaixo foi reconstruído a partir do código do projeto InstaFlow e das rotas de upsell existentes. Não considerar como inventário confirmado da página original /v3 até conferir em navegador.

**Estado:** 16 ofertas de entrada + 5 ofertas adicionais = **21 configurações de venda preparadas**, **0 criadas na conta PerfectPay**, 0 checkouts reais recebidos. O repositório/site original não foi modificado.

## Produtos principais — cobrança única em USD

| Produto | Preço | Página de vendas | Quantidades |
|---|---:|---|---|
| GainFlow Starter | $14.90 | [Abrir](https://instaflow-preview.onrender.com/p/starter-standard.html) | Conferido com o código |
| GainFlow Starter Niche | $22.35 | [Abrir](https://instaflow-preview.onrender.com/p/starter-niche.html) | Conferido com o código |
| GainFlow Growth | $29.90 | [Abrir](https://instaflow-preview.onrender.com/p/growth-standard.html) | Conferido com o código |
| GainFlow Growth Niche | $44.85 | [Abrir](https://instaflow-preview.onrender.com/p/growth-niche.html) | Conferido com o código |
| GainFlow Pro | $39.90 | [Abrir](https://instaflow-preview.onrender.com/p/pro-standard.html) | REVISAR base+bônus |
| GainFlow Pro Niche | $59.85 | [Abrir](https://instaflow-preview.onrender.com/p/pro-niche.html) | REVISAR base+bônus |
| GainFlow Authority | $69.90 | [Abrir](https://instaflow-preview.onrender.com/p/authority-standard.html) | REVISAR base+bônus |
| GainFlow Authority Niche | $104.85 | [Abrir](https://instaflow-preview.onrender.com/p/authority-niche.html) | REVISAR base+bônus |
| GainFlow Influencer | $119.90 | [Abrir](https://instaflow-preview.onrender.com/p/influencer-standard.html) | REVISAR base+bônus |
| GainFlow Influencer Niche | $179.85 | [Abrir](https://instaflow-preview.onrender.com/p/influencer-niche.html) | REVISAR base+bônus |
| GainFlow Scale | $199.90 | [Abrir](https://instaflow-preview.onrender.com/p/scale-standard.html) | REVISAR base+bônus |
| GainFlow Scale Niche | $299.85 | [Abrir](https://instaflow-preview.onrender.com/p/scale-niche.html) | REVISAR base+bônus |
| GainFlow Dominance | $299.90 | [Abrir](https://instaflow-preview.onrender.com/p/dominance-standard.html) | REVISAR base+bônus |
| GainFlow Dominance Niche | $449.85 | [Abrir](https://instaflow-preview.onrender.com/p/dominance-niche.html) | REVISAR base+bônus |
| GainFlow Ultimate | $499.90 | [Abrir](https://instaflow-preview.onrender.com/p/ultimate-standard.html) | REVISAR base+bônus |
| GainFlow Ultimate Niche | $749.85 | [Abrir](https://instaflow-preview.onrender.com/p/ultimate-niche.html) | REVISAR base+bônus |

## Ofertas adicionais — cadastro como produtos próprios

| Ordem | Produto | Preço | Página |
|---|---|---:|---|
| 1 | GainFlow — Account Shield | $39.00 | [Abrir](https://instaflow-preview.onrender.com/offer/upsell-1.html?produto=starter-standard) |
| 2 | GainFlow — Account Shield — Alternative | $19.00 | [Abrir](https://instaflow-preview.onrender.com/offer/downsell-1.html?produto=starter-standard) |
| 3 | GainFlow — Account Verification | $29.90 | [Abrir](https://instaflow-preview.onrender.com/offer/upsell-2.html?produto=starter-standard) |
| 4 | GainFlow — Account Protection | $29.90 | [Abrir](https://instaflow-preview.onrender.com/offer/upsell-3.html?produto=starter-standard) |
| 5 | GainFlow — Follower Retention Assistance | $19.90 | [Abrir](https://instaflow-preview.onrender.com/offer/upsell-4.html?produto=starter-standard) |

**Todos os produtos:** prazo de garantia de 7 dias, moeda USD e cobrança única. Categoria e formato como serviço remoto se aceito pela análise da PerfectPay. Nomes não contêm Instagram, mas as descrições dizem o que realmente é vendido. O e-mail de suporte precisa ser ativado e confirmado; nunca publicar e-mail fictício.

## Jornada após compra principal

```text
Checkout PerfectPay (upsell=true)
  -> Upsell 1: Account Shield $39
       sim -> Upsell 2
       não -> Downsell 1: Alternative $19 -> Upsell 2
  -> Upsell 2: Account Verification $29.90
  -> Upsell 3: Account Protection $29.90
  -> Upsell 4: Follower Retention Assistance $19.90
  -> Página final /obrigado/
```

As páginas já existem no GitHub; as páginas de upsell estão deliberadamente com botões de cobrança desabilitados enquanto os entregáveis, os checkouts e a função One Click são verificados. Não afirmar que uma cobrança ocorreu ao apenas navegar pelas páginas.

## Configuração na PerfectPay

1. Em [Meus Produtos](https://app.perfectpay.com.br), criar os 16 produtos/planos de entrada e os 5 produtos de upsell com nomes, valores e descrições exatas no JSON `sales/perfectpay-v3-catalog.json`.
2. Confirmar a moeda USD antes do cadastro. Usar cobrança única e garantia de 7 dias.
3. Depois de aprovados os produtos, colocar os 16 links em `perfectpay-checkouts.json`, cada entrada nos campos `standard` ou `niche`.
4. Configurar upsell One Click para cada produto principal: **Upsell → Configurar Upsell**, selecionar o produto Account Shield e informar o Link do Upsell `/offer/upsell-1.html?produto=<slug>`.
5. Nas configurações das ofertas seguintes, colocar a URL da próxima página como **Página de Obrigado** (o guia oficial da PerfectPay permite isso). A página final deve ser `/obrigado/?produto=<slug>`.
6. O checkout principal adiciona `upsell=true`. Validar que a PerfectPay realmente apresenta o One Click nas páginas próprias; botões HTML e uma página externa **não** executam transações por conta própria.
7. Confirmar como a PerfectPay trata a recusa no fluxo, principalmente o Downsell 1. As rotas de recusa estão no projeto, mas não foi testado nenhum redirecionamento da plataforma.
8. Configurar webhook para pagamentos aprovados e estornos e conferir pedidos no banco antes de liberar serviço.

**Guia oficial PerfectPay:** https://help.perfectpay.com.br/article/141-upsell-one-click e https://help.perfectpay.com.br/article/593-como-cadastrar-meu-produto-na-perfect-pay

**Pendências importantes:** confirmação visual do V3, e-mail operacional de suporte, verdadeiros detalhes do serviço adicional, reconciliação de quantidades Pro/Authority/Influencer/Scale/Dominance/Ultimate, links de pagamento, análise e aprovação PerfectPay, teste real do fluxo de 1 click. Não anunciar as promessas anteriores de proteção contra shadowban e bloqueio como garantia técnica sem demonstração do serviço.
