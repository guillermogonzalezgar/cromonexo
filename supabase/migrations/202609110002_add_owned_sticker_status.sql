-- Permite registrar los cromos conseguidos además de faltantes y repetidos.
alter type public.sticker_status add value if not exists 'owned';
