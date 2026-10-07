-- Blocks offensive or sexual nicknames, including deliberate spacing,
-- accents and common digit-for-letter substitutions. Existing rows are kept;
-- the trigger protects every new insert and nickname update.
create or replace function public.apelido_tem_conteudo_proibido(valor text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  normalizado text;
  compactado text;
begin
  normalizado := lower(coalesce(valor, ''));
  normalizado := translate(
    normalizado,
    'áàâãäéèêëíìîïóòôõöúùûüç',
    'aaaaaeeeeiiiiooooouuuuc'
  );
  normalizado := regexp_replace(normalizado, '[^a-z0-9]+', ' ', 'g');
  normalizado := btrim(regexp_replace(normalizado, '\s+', ' ', 'g'));
  normalizado := translate(normalizado, '013456789', 'oieasgtbg');
  compactado := replace(normalizado, ' ', '');

  return normalizado ~ '(^| )(anus|babaca|bicha|bosta|bunda|corno|cu|cuzao|cuzona|foda|fodase|foder|gostosa|gostoso|idiota|imbecil|merda|nazista|nude|nudes|otario|pau|pelada|pelado|pica|porra|puta|putaria|puto|rola|sexo|sexy|transa|trouxa|viado)( |$)'
    or compactado ~ '(arrombad|assassin|bucet|capivarud|caralh|estupr|foded|fodid|gostos|gozad|masturb|oncapintud|pelad|penis|pintud|piroc|porn|punhet|siriric|suicid|vagin|xerec)';
end;
$$;

create or replace function public.bloquear_apelido_improprio()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.apelido_tem_conteudo_proibido(new.apelido) then
    raise exception using
      errcode = '23514',
      message = 'Apelido não permitido, escolha outro';
  end if;
  return new;
end;
$$;

drop trigger if exists jogadores_bloquear_apelido_improprio on public.jogadores;
create trigger jogadores_bloquear_apelido_improprio
before insert or update of apelido on public.jogadores
for each row execute function public.bloquear_apelido_improprio();