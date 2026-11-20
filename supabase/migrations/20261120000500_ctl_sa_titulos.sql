alter table public.ctl_sa_acciones add column if not exists archivo text check (char_length(archivo) <= 500);
