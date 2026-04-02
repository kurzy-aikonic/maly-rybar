-- Premium flag per user (pravda na serveru; pozdeji napr. webhook z plateb)
alter table public.profiles
add column if not exists is_premium boolean not null default false;

comment on column public.profiles.is_premium is 'Odemceni Premium obsahu; meni se po overene platbe nebo adminem.';
