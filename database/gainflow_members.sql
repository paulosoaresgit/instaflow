-- GainFlow Club - isolated digital membership schema
-- Apply only to a dedicated Supabase project after ownership is confirmed.
-- No current FLOW/FlowBridge project has been modified.
create extension if not exists pgcrypto;

create table if not exists public.gf_orders (
 sale_code text primary key,
 email text not null check (length(email) <= 254),
 product_code text not null,
 plan_code text,
 sku text not null,
 payment_status text not null check (payment_status in ('pending','approved','rejected','cancelled','refunded','chargeback','review')),
 paid_at timestamptz,
 last_event_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index if not exists gf_orders_active_by_email on public.gf_orders (email,payment_status);
create index if not exists gf_orders_by_sku on public.gf_orders (sku);

create table if not exists public.gf_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 instagram_username text,
 handle_verified boolean not null default false,
 auto_delivery_enabled boolean not null default false,
 verified_at timestamptz,
 daily_limit smallint not null default 10 check (daily_limit in (10,15)),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint gf_instagram_handle_pattern check (instagram_username is null or instagram_username ~ '^[A-Za-z0-9._]{1,30}$')
);
create index if not exists gf_profiles_verified on public.gf_profiles(user_id,handle_verified);

create table if not exists public.gf_claims (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 request_day date not null default (timezone('UTC',now()))::date,
 instagram_username text not null,
 quantity integer not null check (quantity between 1 and 15),
 status text not null check (status in ('processing','submitted','failed','manual_review')),
 provider_order_id text,
 attempt_count integer not null default 1,
 error_detail text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,request_day)
);
create index if not exists gf_claims_user_recent on public.gf_claims(user_id,request_day desc);

create table if not exists public.gf_lessons (
 id bigint generated always as identity primary key,
 module_title text not null,
 module_title_en text,
 position int not null check (position > 0),
 title text not null,
 title_en text,
 body text not null,
 body_en text,
 upsell_slug text,
 created_at timestamptz default now()
);
create unique index if not exists gf_lesson_unique on public.gf_lessons(module_title,position);
create table if not exists public.gf_lesson_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id bigint not null references public.gf_lessons(id) on delete cascade,
 completed_at timestamptz not null default now(),
 primary key (user_id,lesson_id)
);

-- Even if new tables are exposed by the Data API, they are not directly readable or writable.
alter table public.gf_orders enable row level security;
alter table public.gf_profiles enable row level security;
alter table public.gf_claims enable row level security;
alter table public.gf_lessons enable row level security;
alter table public.gf_lesson_progress enable row level security;
revoke all on table public.gf_orders, public.gf_profiles, public.gf_claims, public.gf_lessons, public.gf_lesson_progress from anon, authenticated;
-- Identity sequences have no anon/authenticated privileges by default; do not revoke unrelated sequences.

-- Both sensitive mutations below are accessible only by the service_role.
create or replace function public.gf_reserve_daily(p_user_id uuid,p_quantity int)
returns public.gf_claims
language plpgsql security definer set search_path=''
as $body$
declare v_profile public.gf_profiles%rowtype;
v_claim public.gf_claims%rowtype;
v_day date := (now() at time zone 'UTC')::date;
begin
 select * into v_profile from public.gf_profiles where user_id=p_user_id for update;
 if not found then raise exception 'profile_not_found'; end if;
 if not v_profile.handle_verified then raise exception 'profile_not_verified'; end if;
 if v_profile.instagram_username is null then raise exception 'username_required'; end if;
 if p_quantity <> v_profile.daily_limit then raise exception 'invalid_daily_quantity'; end if;
 if not exists (
  select 1 from public.gf_orders o
  where o.email=lower(v_profile.email) and o.payment_status='approved'
 ) then raise exception 'purchase_not_approved'; end if;
 insert into public.gf_claims(user_id,request_day,instagram_username,quantity,status)
 values (p_user_id,v_day,v_profile.instagram_username,p_quantity,'processing')
 on conflict (user_id,request_day)
 do update set status='processing',
    instagram_username=excluded.instagram_username,quantity=excluded.quantity,
    attempt_count=public.gf_claims.attempt_count+1,updated_at=now(),error_detail=null
 where public.gf_claims.status='failed'
 returning * into v_claim;
 if v_claim.id is null then raise exception 'daily_limit_already_used'; end if;
 return v_claim;
end
$body$;
revoke all on function public.gf_reserve_daily(uuid,int) from public,anon,authenticated;
grant execute on function public.gf_reserve_daily(uuid,int) to service_role;

create or replace function public.gf_ingest_sale(
 p_code text,p_email text,p_product_code text,p_plan_code text,p_sku text,p_status text,p_paid_at timestamptz
) returns void language plpgsql security definer set search_path=''
as $body$
begin
 if nullif(trim(p_code),'') is null or nullif(trim(p_email),'') is null or
    nullif(trim(p_product_code),'') is null or nullif(trim(p_sku),'') is null then
   raise exception 'invalid_sale_data';
 end if;
 if p_status not in ('pending','approved','rejected','cancelled','refunded','chargeback','review') then
   raise exception 'unsupported_sale_status';
 end if;
 insert into public.gf_orders(sale_code,email,product_code,plan_code,sku,payment_status,paid_at)
 values(trim(p_code),lower(trim(p_email)),trim(p_product_code),p_plan_code,trim(p_sku),p_status,p_paid_at)
 on conflict(sale_code) do update set
   payment_status=excluded.payment_status,
   last_event_at=now(),
   paid_at=case when excluded.payment_status='approved' then coalesce(public.gf_orders.paid_at,excluded.paid_at) else public.gf_orders.paid_at end
 where
   -- Never reactivate an order after a refund/chargeback/cancellation, even if old notifications arrive.
   public.gf_orders.payment_status not in ('refunded','chargeback','cancelled')
   and (public.gf_orders.payment_status <> 'approved' or excluded.payment_status in ('approved','refunded','chargeback','cancelled'));
end
$body$;
revoke all on function public.gf_ingest_sale(text,text,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.gf_ingest_sale(text,text,text,text,text,text,timestamptz) to service_role;

-- The complete course is stored in the protected database, not in public JS bundles.
insert into public.gf_lessons(module_title,position,title,body,upsell_slug) values
('01 · Fundamentos da viralização', 1, 'Como funciona a atenção', 'Objetivo: entender por que alguém para de rolar a tela.

Atenção é conquistada nos primeiros segundos por contraste, curiosidade ou uma promessa concreta. Escolha um público específico e uma transformação que você sabe ensinar. Evite prometer que qualquer vídeo terá milhões de visualizações.

EXERCÍCIO: Liste 10 perguntas reais que seu público faz. Transforme cada uma em um vídeo de 15 a 35 segundos, começando pela pergunta e mostrando um exemplo.

CHECKLIST: o vídeo tem uma única ideia, uma abertura interessante e uma conclusão útil.', null),
('01 · Fundamentos da viralização', 2, 'Defina seu nicho e a promessa', 'Público amplo demais torna os exemplos genéricos. Escolha um tema central, um público e três pilares: ensinar, demonstrar e contar histórias.

MODELO: Ajudo [público] a [resultado realista] usando [habilidade ou método]. Exemplo: ajudo pequenos negócios a filmar produtos com o celular.

EXERCÍCIO: Defina cinco temas que você já domina e dez erros que pode demonstrar de forma prática.

Não confunda seguidores com audiência qualificada: avalie respostas e conversas, não só contagem.', null),
('01 · Fundamentos da viralização', 3, 'Sua linha editorial de 30 dias', 'Combine três formatos: dicas rápidas, bastidores e casos explicados. Um calendário sustentável é melhor do que publicar muito por poucos dias.

PLANILHA SIMPLES: dia, tema, formato, gancho, gravação, publicação, retenção, compartilhamentos e observação.

DESAFIO: Planeje 12 ideias. Organize em quatro semanas, revise resultados a cada sete dias e mantenha o que realmente interessa à audiência.', null),
('02 · Ganchos que prendem', 1, 'O primeiro segundo do vídeo', 'Em vez de começar com apresentação longa, mostre uma transformação visual ou pergunte algo específico.

EXEMPLOS: ''Três erros que deixam seu vídeo escuro''; ''Olha como ficou antes e depois''; ''Você faz isso quando grava?''.

TESTE: grave três aberturas para a mesma ideia e compare retenção. Não invente resultados e não use clickbait que o vídeo não responde.', null),
('02 · Ganchos que prendem', 2, 'Biblioteca de 20 aberturas', 'Ganchos de problema: ''Você perde tempo quando...'', ''Pare de fazer...'', ''O erro mais comum em...''. Ganchos de demonstração: ''Veja o que muda quando...'', ''Antes e depois de...'', ''Vou testar...''. Ganchos de tutorial: ''Em 30 segundos, faça...'', ''Comece por...'', ''Salve este passo a passo...''.

EXERCÍCIO: Escolha cinco formatos e escreva quatro variações para seu nicho. Leia em voz alta. Se soar como propaganda, simplifique.

Promessas devem corresponder ao conteúdo entregue.', null),
('02 · Ganchos que prendem', 3, 'Gancho visual e textual', 'O texto na tela precisa ser curto e legível; a imagem inicial deve comunicar o assunto sem depender da legenda.

ROTEIRO: em 0–2s mostre o resultado; em 2–5s diga o que será ensinado; em 5–20s entregue os passos; ao final convide a salvar se foi útil.

EXERCÍCIO: assista seu vídeo sem som. Uma pessoa ainda entende a mensagem?', null),
('03 · Roteiros de Reels', 1, 'Estrutura problema → solução → exemplo', 'Um roteiro claro costuma funcionar em quatro movimentos: problema concreto, explicação, demonstração e fechamento.

TEMPLATE: ''Quando [problema], experimente [ação]. Primeiro [passo 1]. Depois [passo 2]. Veja a diferença no exemplo. Se fizer sentido, salve para testar.''

EXERCÍCIO: escreva um roteiro de 80 palavras. Remova frases que não ajudam o público.', null),
('03 · Roteiros de Reels', 2, 'Storytelling em 30 segundos', 'Histórias conectam quando há personagem, obstáculo e aprendizado.

TEMPLATE: ''Eu tentei [ação]. O problema era [obstáculo]. Mudei [decisão] e percebi [aprendizado]. Se você está passando por isso, experimente [ação].''

Evite testemunhos inventados. Conte o que viveu ou identifique claramente um exemplo fictício.

EXERCÍCIO: grave uma história honesta sobre algo que não funcionou como você esperava.', null),
('03 · Roteiros de Reels', 3, 'Chamadas para ação sem pressão', 'Uma boa chamada para ação ajuda o usuário a continuar o aprendizado.

EXEMPLOS: ''Salve o checklist para sua próxima gravação''; ''Qual dessas opções você testaria?''; ''Comente a dúvida que devo explicar em outro vídeo''.

Não manipule com urgência falsa ou recompensas inexistentes. Um CTA por vídeo é suficiente.

EXERCÍCIO: adapte três CTAs ao objetivo de educação, conversa ou visita ao perfil.', null),
('04 · Produção com celular', 1, 'Luz, enquadramento e áudio', 'Antes de gravar, limpe a lente, encontre luz lateral suave e teste o microfone. Prefira fundos simples.

CHECKLIST: rosto ou objeto em foco; celular na vertical; janela à frente ou de lado; ruído controlado; duração adequada à ideia.

EXERCÍCIO: grave a mesma fala com luz frontal, lateral e contra a luz. Compare nitidez e naturalidade.', null),
('04 · Produção com celular', 2, 'Planos de câmera e B-roll', 'Intercale um plano principal com detalhes que demonstram a ação. B-roll não precisa ser elaborado; mãos, tela, produto e processo podem explicar muito.

SEQUÊNCIA: abertura com resultado, demonstração de uma etapa, close de detalhe, retorno ao narrador e conclusão.

EXERCÍCIO: monte cinco cenas de 3 segundos. Consiga entender a história mesmo sem narração?', null),
('04 · Produção com celular', 3, 'Gravação eficiente em lote', 'Agrupe roteiros que usam o mesmo cenário. Prepare figurino, câmera, luz, falas e objetos antes de começar.

ROTINA DE 60 MINUTOS: 10 para roteiro, 10 para teste de áudio e luz, 30 para gravar três vídeos, 10 para organizar arquivos.

EXERCÍCIO: grave três vídeos curtos em uma sessão. Dê nomes claros aos arquivos para facilitar a edição.', null),
('05 · Edição e ritmo', 1, 'Corte o que não agrega', 'Na edição, remova pausas excessivas e repetições sem eliminar contexto essencial. Ritmo é clareza, não pressa.

REVISÃO: veja o vídeo do começo ao fim. A primeira fala promete algo? Há cortes que confundem? O fechamento entrega o prometido?

EXERCÍCIO: corte 10% da duração mantendo a mesma mensagem.', null),
('05 · Edição e ritmo', 2, 'Legendas e acessibilidade', 'Adicione legendas legíveis e revise nomes, números e pontuação. Evite cobrir rostos ou elementos importantes.

PADRÃO: frases curtas, contraste alto, margem segura da interface e sincronização com a fala.

EXERCÍCIO: assista ao Reel no mudo, em tela pequena, e corrija qualquer trecho ilegível.', null),
('05 · Edição e ritmo', 3, 'Música, direitos autorais e acabamento', 'Use trilhas licenciadas ou disponíveis nas bibliotecas permitidas para sua conta. Evite copiar áudio protegido de terceiros sem autorização.

CHECKLIST FINAL: resolução adequada, áudio equilibrado, capa clara, legenda revisada e marcações corretas.

EXERCÍCIO: exporte um vídeo e verifique áudio e legenda antes de publicar.', null),
('06 · Publicação e distribuição', 1, 'Legenda e palavras-chave', 'Escreva uma legenda que complemente o vídeo. Comece pela informação útil, explique o contexto e acrescente palavras naturalmente relacionadas ao tema.

TEMPLATE: ''Neste vídeo você aprende [tema]. Faça [passo 1] e [passo 2]. O principal cuidado é [observação].''

Não use dezenas de hashtags desconexas; prefira tags que façam sentido para a audiência.', null),
('06 · Publicação e distribuição', 2, 'Horários e consistência', 'Não existe horário universal que garanta viralização. Observe quando sua audiência responde e teste duas ou três janelas de publicação por algumas semanas.

EXERCÍCIO: publique vídeos equivalentes em horários diferentes, registre alcance, duração de visualização, comentários e compartilhamentos.

Tire conclusões com vários exemplos, não com apenas um vídeo.', null),
('06 · Publicação e distribuição', 3, 'Aproveitamento em diferentes canais', 'Reaproveite um conteúdo educativo em formatos diferentes: Reel curto, carrossel-resumo, Stories com perguntas e vídeo explicativo mais longo.

Evite adicionar marcas d''água de outras plataformas quando possível. Respeite os direitos de uso dos materiais.

DESAFIO: transforme um tutorial de 30 segundos em quatro publicações úteis para públicos com preferências diferentes.', null),
('07 · Métricas que importam', 1, 'Entenda retenção e alcance', 'Visualizações sozinhas não contam toda a história. Compare alcance, tempo médio assistido, conclusão, compartilhamentos, salvamentos e comentários.

EXERCÍCIO: escolha os últimos cinco vídeos e registre quais temas geraram retenção e perguntas reais.

Não atribua crescimento de perfil automaticamente a uma única ação sem dados.', null),
('07 · Métricas que importam', 2, 'Experimento A/B de gancho', 'Teste uma variável por vez. Mantenha ideia e público semelhantes; mude somente o primeiro segundo ou a capa.

PLANILHA: vídeo A, vídeo B, hipótese, data, alcance, retenção e observações. Experimentos no Instagram não são perfeitamente controlados; interprete com cautela.

EXERCÍCIO: escreva uma hipótese que possa ser rejeitada com dados.', null),
('07 · Métricas que importam', 3, 'O ciclo semanal de melhoria', 'Toda semana, identifique três vídeos acima da sua média e três abaixo. Observe padrões: gancho, duração, tema, edição e contexto.

ROTINA: manter o que funciona, ajustar uma variável e testar de novo. Não apague automaticamente vídeos com baixo alcance: eles ainda podem informar novas ideias.

CHECKLIST: hipótese, teste, aprendizado e próxima tentativa.', null),
('08 · Plano de 30 dias', 1, 'Semana 1: fundação e 6 roteiros', 'Dia 1: defina audiência. Dia 2: escolha três pilares. Dia 3: reúna 20 perguntas. Dias 4 e 5: escreva seis roteiros. Dias 6 e 7: grave e publique dois pilotos.

META: estabelecer uma rotina que você consegue manter, não perseguir números artificiais.

ENTREGA: seis roteiros revisados e duas publicações de teste.', null),
('08 · Plano de 30 dias', 2, 'Semanas 2 e 3: publicar e testar', 'Semana 2: publique três Reels, teste duas aberturas e registre retenção. Semana 3: produza três novas peças reaproveitando o melhor tema e grave uma história real.

A cada publicação, responda dúvidas com educação e registre comentários que podem virar novos conteúdos.

ENTREGA: uma tabela simples com tema, gancho, resultado e hipótese seguinte.', null),
('08 · Plano de 30 dias', 3, 'Semana 4: análise e próximo ciclo', 'Publique três vídeos adicionais. Compare a primeira e a quarta semana sem prometer resultados mínimos. Identifique os conteúdos com mais salvamentos, compartilhamentos e conversas relevantes.

EXERCÍCIO FINAL: escreva uma estratégia de mais 30 dias com três pilares, oito roteiros e dois experimentos claros.

Seu processo fica mais forte quando você mede, aprende e adapta.', null),
('Bônus · Segurança da conta', 1, 'Checklist de autenticação em duas etapas', 'Ative autenticação em dois fatores pelo próprio Instagram, guarde códigos de recuperação em local seguro e revise sessões ativas. Não entregue sua senha a sites que prometem métricas ou seguidores.

CHECKLIST: 2FA, e-mail atualizado, recuperação de conta, aplicativos conectados e alertas de login. Este curso não impede bloqueios da plataforma.', 'upsell-1'),
('Bônus · Segurança essencial', 1, 'Guia rápido para proteger o acesso', 'Confira se o e-mail e o telefone de recuperação estão atuais. Ative 2FA e verifique os aplicativos com acesso autorizado. Não compartilhe tokens nem códigos recebidos.

Este é um guia educativo condensado. Não representa proteção técnica automática.', 'downsell-1'),
('Bônus · Identidade do perfil', 1, 'Como comprovar o controle do seu perfil', 'Aprenda a identificar as etapas oficiais de confirmação do Instagram e onde encontrar os recursos de central de contas e segurança.

Somente a plataforma pode emitir selos oficiais. Este kit não fornece verificação da Meta e não garante aprovação.', 'upsell-2'),
('Bônus · Segurança avançada', 1, 'Plano de defesa e recuperação', 'Monte um procedimento de resposta a invasões: alertas, revisão de credenciais, backup de conteúdo, denúncia de tentativas de phishing e atualização dos dispositivos.

Faça um teste de recuperação do e-mail principal. Nenhuma técnica garante imunidade a restrições ou suspensão.', 'upsell-3'),
('Bônus · Retenção de audiência', 1, 'Diário de variações de seguidores', 'Crie uma planilha com dia, seguidores, publicações, retenção de vídeos e comentários. Observe variações naturais e teste formatos de conteúdo sem conclusões apressadas.

Aulas e checklists de retenção não impedem remoção de contas nem garantem estabilidade da base.', 'upsell-4')
on conflict (module_title,position) do update set
 title=excluded.title,body=excluded.body,upsell_slug=excluded.upsell_slug;

-- RLS intentionally has NO anon/authenticated policies; all reads use a verified Edge Function.

-- English edition of the protected curriculum. Choose PT or EN at runtime.
update public.gf_lessons set module_title_en='01 · Reels Foundations',title_en='How attention works',body_en='The first seconds of a Reel must give a reason to watch: a relevant problem, visual change or useful result. Choose one honest idea per video. PRACTICE: collect ten questions from your audience and turn each into a 15–35 second teaching clip. Review the opening, demonstration and conclusion. No strategy guarantees viral reach.' where module_title='01 · Fundamentos da viralização' and position=1;
update public.gf_lessons set module_title_en='01 · Reels Foundations',title_en='Choose your niche and promise',body_en='Pick a specific audience, one transformation you can genuinely help with, and three content pillars: tutorials, demonstrations and stories. TEMPLATE: I help [audience] improve [skill] through [method]. PRACTICE: list ten common mistakes in your topic and film one example. Real conversations matter more than raw follower counts.' where module_title='01 · Fundamentos da viralização' and position=2;
update public.gf_lessons set module_title_en='01 · Reels Foundations',title_en='Create a 30-day content plan',body_en='Plan twelve ideas across four weeks. For each, record the date, topic, hook, format, production status, publishing date, watch time, shares and saves. Use a consistent schedule you can maintain. REVIEW every seven days and improve themes that generate useful comments. Your goal is repeatable learning, not a promised view count.' where module_title='01 · Fundamentos da viralização' and position=3;
update public.gf_lessons set module_title_en='02 · Hook Lab',title_en='The first second',body_en='Avoid lengthy introductions. Begin with an on-screen demonstration, specific question or clear outcome. EXAMPLES: Three mistakes that make your video dark; Before and after changing my lighting; Are you filming this wrong? TEST: record three openings for the same idea and compare watch time. Keep the hook truthful.' where module_title='02 · Ganchos que prendem' and position=1;
update public.gf_lessons set module_title_en='02 · Hook Lab',title_en='Twenty hook templates',body_en='Try these patterns: Stop doing [mistake]; The fastest way to understand [topic]; I tested [approach]; Watch what changes when [action]; Three things I learned from [experience]. For each of five patterns, write four variations suited to your niche. Read them out loud and simplify anything that sounds like misleading advertising.' where module_title='02 · Ganchos que prendem' and position=2;
update public.gf_lessons set module_title_en='02 · Hook Lab',title_en='Visual hooks',body_en='A viewer should understand the topic even with the sound off. Use concise on-screen text, legible contrast and a demonstration in the first frame. SAMPLE STRUCTURE: 0–2 seconds show the outcome, 2–5 seconds explain the value, 5–20 seconds show the steps, end with a practical takeaway. Test on a small screen.' where module_title='02 · Ganchos que prendem' and position=3;
update public.gf_lessons set module_title_en='03 · Short-Form Scripts',title_en='Problem, solution, example',body_en='Build scripts in four parts: real problem, quick explanation, demonstration and useful conclusion. TEMPLATE: When [problem], try [method]. First do [step one], then [step two]. Here is the difference. PRACTICE: write about 80 words and cut any sentence that does not help the viewer understand the topic.' where module_title='03 · Roteiros de Reels' and position=1;
update public.gf_lessons set module_title_en='03 · Short-Form Scripts',title_en='Storytelling in 30 seconds',body_en='A story needs a person, obstacle, change and lesson. TEMPLATE: I tried [action]. It did not work because [obstacle]. I changed [decision] and learned [insight]. Avoid fictional testimonials presented as real customer experiences. PRACTICE: film a short honest story about a mistake and what you learned.' where module_title='03 · Roteiros de Reels' and position=2;
update public.gf_lessons set module_title_en='03 · Short-Form Scripts',title_en='Calls to action',body_en='A useful CTA offers a next step: Save this checklist for filming; Which method would you test?; Tell me a question for the next tutorial. Prefer one CTA per video. Avoid fake urgency and engagement bait. PRACTICE: write one CTA for education, one for discussion and one for a profile visit.' where module_title='03 · Roteiros de Reels' and position=3;
update public.gf_lessons set module_title_en='04 · Shoot With Your Phone',title_en='Lighting and sound',body_en='Clean your camera lens, choose soft side lighting and test your microphone before shooting. Frame vertically and keep distractions out of the background. CHECKLIST: sharp focus, stable framing, balanced sound, enough light and readable text. PRACTICE: film the same line with three lighting positions and compare naturalness.' where module_title='04 · Produção com celular' and position=1;
update public.gf_lessons set module_title_en='04 · Shoot With Your Phone',title_en='B-roll and framing',body_en='Mix the main shot with detail shots that show the actual process. Hands, a product, a screen or a close-up are enough for useful B-roll. STORYBOARD: opening result, first step, detail shot, demonstration, conclusion. PRACTICE: make five short clips that tell a story even without narration.' where module_title='04 · Produção com celular' and position=2;
update public.gf_lessons set module_title_en='04 · Shoot With Your Phone',title_en='Batch recording',body_en='Group scripts that share the same location, light and props. A simple one-hour session can include ten minutes planning, ten minutes setup, thirty minutes filming and ten minutes organizing files. PRACTICE: produce three short Reels in one session and give each file a descriptive name.' where module_title='04 · Produção com celular' and position=3;
update public.gf_lessons set module_title_en='05 · Edit for Clarity',title_en='Remove unnecessary pauses',body_en='Good pacing means clarity, not speed for its own sake. Remove repeated sentences and dead time but keep enough context for the demonstration to make sense. REVIEW: Does the first line offer value? Do cuts confuse? Does the ending deliver the opening promise? PRACTICE: shorten a draft by ten percent.' where module_title='05 · Edição e ritmo' and position=1;
update public.gf_lessons set module_title_en='05 · Edit for Clarity',title_en='Captions and accessibility',body_en='Add accurate subtitles that work on a phone screen. Keep strong contrast, short lines and safe margins away from buttons. Check spelling, names and numbers rather than trusting automatic captions. PRACTICE: watch the final cut on mute and fix every section that is hard to follow.' where module_title='05 · Edição e ritmo' and position=2;
update public.gf_lessons set module_title_en='05 · Edit for Clarity',title_en='Music and export checklist',body_en='Use properly licensed audio or platform libraries allowed for your account. Avoid reusing copyrighted material without permission. FINAL CHECK: correct vertical format, balanced audio, readable captions, accurate cover and honest text. Export a test version and inspect it on your phone before publishing.' where module_title='05 · Edição e ritmo' and position=3;
update public.gf_lessons set module_title_en='06 · Publish Strategically',title_en='Captions and keywords',body_en='Use captions to add value, not to repeat the full audio. Write the topic naturally and include a few truly relevant keywords or hashtags. TEMPLATE: In this Reel you will learn [topic]. Try [step one] and [step two]. Remember [important caution]. Avoid unrelated hashtag stuffing.' where module_title='06 · Publicação e distribuição' and position=1;
update public.gf_lessons set module_title_en='06 · Publish Strategically',title_en='Timing and consistency',body_en='There is no universal posting time that guarantees reach. Test several time windows and record watch time, reach, comments and shares. Compare multiple videos before forming conclusions. PRACTICE: choose a sustainable publishing schedule for three weeks and review audience response rather than guessing.' where module_title='06 · Publicação e distribuição' and position=2;
update public.gf_lessons set module_title_en='06 · Publish Strategically',title_en='Repurpose with care',body_en='Turn one clear idea into a Reel, carousel summary, story poll and longer tutorial. Adapt the content to each format and respect content licenses. PRACTICE: use one original 30-second demonstration to create four separate, useful pieces without adding unrelated material.' where module_title='06 · Publicação e distribuição' and position=3;
update public.gf_lessons set module_title_en='07 · Analytics and Testing',title_en='Metrics beyond views',body_en='Compare reach, average watch duration, completion, saves, shares and genuine comments. View count alone is not a measure of customer interest or real audience connection. PRACTICE: audit five recent videos and identify the topics that led to useful conversations. Be cautious before attributing growth to one cause.' where module_title='07 · Métricas que importam' and position=1;
update public.gf_lessons set module_title_en='07 · Analytics and Testing',title_en='Test one variable',body_en='For a meaningful A/B test, change just one variable, such as the opening or cover, while keeping the topic similar. TRACK: hypothesis, version A, version B, date, retention and notes. Social platforms are not controlled laboratories, so compare several examples and interpret results carefully.' where module_title='07 · Métricas que importam' and position=2;
update public.gf_lessons set module_title_en='07 · Analytics and Testing',title_en='Weekly improvement loop',body_en='Once a week, compare three above-average and three below-average clips. Look for patterns in hooks, length, storytelling, audio and topic. Keep strong elements, adjust one weakness, and test again. CHECKLIST: hypothesis, evidence, lesson learned, next experiment.' where module_title='07 · Métricas que importam' and position=3;
update public.gf_lessons set module_title_en='08 · Your 30-Day Challenge',title_en='Week 1: build foundations',body_en='Day 1 define your audience; Day 2 select three content pillars; Day 3 collect twenty questions; Days 4–5 write six scripts; Days 6–7 film and publish two pilots. DELIVERABLE: six ready-to-record scripts and two test posts. Aim for consistency rather than artificial metrics.' where module_title='08 · Plano de 30 dias' and position=1;
update public.gf_lessons set module_title_en='08 · Your 30-Day Challenge',title_en='Weeks 2 and 3: practice',body_en='Week 2 publish three Reels and test two different openings while logging watch time. Week 3 create three new clips based on the most useful previous topic and tell one authentic story. Record questions from comments to inspire future videos. DELIVERABLE: a tracking sheet with topic, hook, result and learning.' where module_title='08 · Plano de 30 dias' and position=2;
update public.gf_lessons set module_title_en='08 · Your 30-Day Challenge',title_en='Week 4: review and repeat',body_en='Publish three additional clips and compare the first and last weeks. Review saves, shares, watch time and helpful discussions without promising a particular outcome. FINAL ASSIGNMENT: plan the next 30 days with three pillars, eight scripts and two new experiments.' where module_title='08 · Plano de 30 dias' and position=3;
update public.gf_lessons set module_title_en='Bonus · Account Safety',title_en='Two-factor authentication',body_en='Enable two-factor authentication directly in Instagram settings, update your recovery email and store backup codes safely. Review logged-in devices and third-party permissions. Never share passwords or verification codes. This lesson does not guarantee immunity from enforcement or account restrictions.' where module_title='Bônus · Segurança da conta' and position=1;
update public.gf_lessons set module_title_en='Bonus · Safety Essentials',title_en='Five-step account checklist',body_en='Check recovery email and phone, enable two-factor authentication, store recovery codes, verify authorized apps and review login alerts. These are educational steps rather than automated account protection.' where module_title='Bônus · Segurança essencial' and position=1;
update public.gf_lessons set module_title_en='Bonus · Identity Toolkit',title_en='Official verification basics',body_en='Learn how to find account identity and security controls in Instagram''s official interfaces. Only Meta can issue verified badges or identity decisions. This educational guide does not provide a badge or promise approval.' where module_title='Bônus · Identidade do perfil' and position=1;
update public.gf_lessons set module_title_en='Bonus · Advanced Protection',title_en='Account recovery plan',body_en='Build a recovery workflow: secure your email, change exposed passwords, revoke suspicious sessions, back up your content and document phishing attempts. Practice keeping your recovery options current. This training cannot prevent all account suspensions.' where module_title='Bônus · Segurança avançada' and position=1;
update public.gf_lessons set module_title_en='Bonus · Retention Playbook',title_en='Monitor your audience',body_en='Track daily follower count, Reels posted, watch time, shares and relevant comments. Use changes as signals for content experiments, not immediate proof of cause. This course does not guarantee followers remain on a profile.' where module_title='Bônus · Retenção de audiência' and position=1;
