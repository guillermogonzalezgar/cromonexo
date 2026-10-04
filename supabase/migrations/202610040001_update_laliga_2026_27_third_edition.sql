-- Fuente: Checklist_LALIGA_2026-27-3ED-3.pdf (5 páginas).
-- Añade la tercera edición sin borrar cromos ni cambiar sus identificadores.
begin;

do $$
begin
  if not exists (select 1 from public.collections where slug = 'laliga-este-2026-27') then
    raise exception 'Primero debe existir la colección LaLiga ESTE 2026/27';
  end if;
end $$;

-- Correcciones del catálogo anterior. Conservan id y las marcas relacionadas.
-- Si el destino ya existe, no se elimina ni fusiona ningún cromo del usuario.
update public.stickers s
set number = fix.new_number, team = fix.new_team
from public.collections c,
(values
  ('11A', 'Maguette', 'Racing De Santander', '11', 'Racing De Santander'),
  ('11B', 'Nteka', 'Racing De Santander', '11B', 'Rayo Vallecano'),
  ('11', 'Pedro Díaz', 'Rayo Vallecano', '11A', 'Rayo Vallecano')
) as fix(old_number, player_name, old_team, new_number, new_team)
where s.collection_id = c.id and c.slug = 'laliga-este-2026-27'
  and s.number = fix.old_number and s.name = fix.player_name and s.team = fix.old_team
  and not exists (
    select 1 from public.stickers target
    where target.collection_id = s.collection_id
      and target.number = fix.new_number and target.team = fix.new_team
  );

insert into public.stickers (collection_id, number, name, team, category)
select c.id, item.number, item.name, item.team, item.category
from public.collections c
cross join (values
  ('4', 'Adrián Rodríguez', 'Deportivo Alavés', 'portero'),
  ('8BIS', 'Garcés', 'Deportivo Alavés', 'defensa'),
  ('10', 'Mikel Rodríguez', 'Deportivo Alavés', 'medio'),
  ('20BIS', 'Mariano', 'Deportivo Alavés', 'delantero'),
  ('10BIS', 'Grimaldo', 'Atlético De Madrid', 'defensa'),
  ('16BIS', 'Arnau Ortiz', 'Atlético De Madrid', 'delantero'),
  ('18BIS', 'Abdelkarim', 'Fc Barcelona', 'delantero'),
  ('11BIS', 'Deossa', 'Real Betis', 'medio'),
  ('19BIS', 'Hugo González', 'Rc Celta De Vigo', 'delantero'),
  ('8BIS', 'Bright Ede', 'Deportivo', 'defensa'),
  ('14BIS', 'Gijselhat', 'Deportivo', 'medio'),
  ('17', 'Asp Jensen', 'Deportivo', 'delantero'),
  ('6BIS', 'Drkusic', 'Rcd Espanyol', 'defensa'),
  ('9BIS', 'Hinojo', 'Rcd Espanyol', 'defensa'),
  ('15BIS', 'Javi Hernández', 'Rcd Espanyol', 'delantero'),
  ('13', 'Francho', 'Getafe Cf', 'medio'),
  ('15', 'Mangala', 'Getafe Cf', 'medio'),
  ('19BIS', 'Ünal', 'Getafe Cf', 'delantero'),
  ('6BIS', 'Nacho Pérez', 'Levante Ud', 'defensa'),
  ('16BIS', 'Thiago Fernández', 'Levante Ud', 'delantero'),
  ('7BIS', 'Konaté', 'Real Madrid Cf', 'defensa'),
  ('6BIS', 'Recio', 'Malaga Cf', 'defensa'),
  ('16BIS', 'Dubasin', 'Osasuna', 'delantero'),
  ('3', 'Agirrezabala', 'Racing De Santander', 'portero'),
  ('8BIS', 'Pedro Felipe', 'Racing De Santander', 'defensa'),
  ('13BIS', 'Sergio Martínez', 'Racing De Santander', 'medio'),
  ('15BIS', 'Zabiri', 'Racing De Santander', 'delantero'),
  ('7BIS', 'Vertrouwd', 'Rayo Vallecano', 'defensa'),
  ('10BIS', 'Pelayo', 'Rayo Vallecano', 'defensa'),
  ('4', 'Fran González', 'Sevilla', 'portero'),
  ('8BIS', 'Julio Díaz', 'Sevilla', 'defensa'),
  ('19BIS', 'Miguel Sierra', 'Sevilla', 'delantero'),
  ('UF21', 'Bernardo Silva (Real Madrid)', 'Últimos Fichajes', 'medio'),
  ('UF22', 'Amatucci (Deportivo)', 'Últimos Fichajes', 'medio'),
  ('UF23', 'Mojica (Getafe)', 'Últimos Fichajes', 'defensa'),
  ('UF24', 'Gordon (Barcelona)', 'Últimos Fichajes', 'delantero'),
  ('UF25', 'Robbie Ure (Sevilla)', 'Últimos Fichajes', 'delantero'),
  ('UF26', 'Javi Morcillo (Sevilla)', 'Últimos Fichajes', 'medio'),
  ('UF27', 'Nuñez (Espanyol)', 'Últimos Fichajes', 'defensa'),
  ('UF28', 'Maffeo (Valencia)', 'Últimos Fichajes', 'defensa'),
  ('UF29', 'Cucurella (Real Madrid)', 'Últimos Fichajes', 'defensa'),
  ('UF30', 'Valentini (Alavés)', 'Últimos Fichajes', 'defensa'),
  ('UF31', 'Sazonov (Getafe)', 'Últimos Fichajes', 'defensa'),
  ('UF32', 'Buonanotte (Elche)', 'Últimos Fichajes', 'medio'),
  ('UF33', 'Angeliño (Deportivo)', 'Últimos Fichajes', 'defensa'),
  ('UF34', 'Iván Martín (Racing)', 'Últimos Fichajes', 'medio'),
  ('UF35', 'Peio Canales (Athletic)', 'Últimos Fichajes', 'medio'),
  ('UF36', 'Kochorashvili (Sevilla)', 'Últimos Fichajes', 'medio'),
  ('UF37', 'Galán (Celta)', 'Últimos Fichajes', 'defensa'),
  ('UF38', 'Parrott (Betis)', 'Últimos Fichajes', 'delantero'),
  ('UF39', 'Diomande (Real Madrid)', 'Últimos Fichajes', 'delantero'),
  ('UF40', 'Rodri (Barcelona)', 'Últimos Fichajes', 'medio'),
  ('21', 'Rodri Mendoza (Atlético de Madrid)', 'Draft 23', 'medio'),
  ('K21', 'Rodri Mendoza (Atlético de Madrid)', 'Draft 23 Kromix', 'medio')
) as item(number, name, team, category)
where c.slug = 'laliga-este-2026-27'
on conflict (collection_id, number, team) do update
set name = excluded.name, category = excluded.category;

update public.collections c
set name = 'LaLiga ESTE 2026/27 · 3.ª edición',
    total_stickers = (select count(*) from public.stickers s where s.collection_id = c.id),
    is_active = true
where c.slug = 'laliga-este-2026-27';

commit;
