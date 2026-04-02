-- Přezdívka a rybí avatar pro dětský profil (volitelné, sync z aplikace)
alter table public.profiles
add column if not exists display_name text null;

alter table public.profiles
add column if not exists fish_avatar_id text null;

comment on column public.profiles.display_name is 'Prezdivka ditete (verejne citliva – neshromažďovat zbytečně).';
comment on column public.profiles.fish_avatar_id is 'Identifikator rybiho avatara z aplikace (napr. kapr, pstruh).';
