-- Actualización de la colección LaLiga ESTE 2026/27 según la checklist de 2ª edición.
-- Conserva los cromos existentes para no perder las marcas de los usuarios.

insert into public.stickers (collection_id, number, name, team, category)
select collection.id, item.number, item.name, item.team, item.category
from public.collections collection
cross join (values
  ('13BIS', 'Prados', 'Athletic Club De Bilbao', 'medio'),
  ('4BIS', 'Diego Conde', 'Real Betis', 'portero'),
  ('13', 'Facundo Bernal', 'Real Betis', 'medio'),
  ('14BIS', 'Vecino', 'Rc Celta De Vigo', 'medio'),
  ('2', 'Martín Anselmi', 'Elche Cf', 'entrenador'),
  ('4', 'Iturbe', 'Elche Cf', 'portero'),
  ('17', 'Ali Houary', 'Elche Cf', 'delantero'),
  ('10', 'Hartman', 'Rcd Espanyol', 'defensa'),
  ('15', 'Marcos Fernández', 'Rcd Espanyol', 'delantero'),
  ('14', 'Terrats', 'Getafe Cf', 'medio'),
  ('16', 'Juanmi', 'Getafe Cf', 'delantero'),
  ('8', 'Mandi', 'Levante Ud', 'defensa'),
  ('13', 'Dani Requena', 'Levante Ud', 'medio'),
  ('20BIS', 'Musuayi', 'Levante Ud', 'delantero'),
  ('17BIS', 'Carlos Espí', 'Real Madrid Cf', 'delantero'),
  ('7', 'Calero', 'Malaga Cf', 'defensa'),
  ('10', 'Salinas', 'Malaga Cf', 'defensa'),
  ('6BIS', 'Pablo Ramón', 'Racing De Santander', 'defensa'),
  ('13B', 'Zakharyan', 'Real Sociedad', 'medio'),
  ('6BIS', 'Iglesias', 'Sevilla', 'defensa'),
  ('13', 'Guridi', 'Sevilla', 'medio'),
  ('16BIS', 'Dieng', 'Valencia', 'medio'),
  ('19BIS', 'Danjuma', 'Valencia', 'delantero'),
  ('4BIS', 'Gulácsi', 'Villarreal', 'portero'),
  ('UF1', 'Canales (Racing de Santander)', 'Últimos Fichajes', 'medio'),
  ('UF2', 'Calatrava (Espanyol)', 'Últimos Fichajes', 'medio'),
  ('UF3', 'Dumfries (Real Madrid)', 'Últimos Fichajes', 'defensa'),
  ('UF4', 'Carlos Romero (Espanyol)', 'Últimos Fichajes', 'defensa'),
  ('UF5', 'Hjulmand (Atlético de Madrid)', 'Últimos Fichajes', 'medio'),
  ('UF6', 'Fran García (Real Madrid)', 'Últimos Fichajes', 'defensa'),
  ('UF7', 'Bardelli (Levante)', 'Últimos Fichajes', 'medio'),
  ('UF8', 'Leo Román (Deportivo)', 'Últimos Fichajes', 'portero'),
  ('UF9', 'De Haas (Valencia)', 'Últimos Fichajes', 'defensa'),
  ('UF10', 'Febas (Celta)', 'Últimos Fichajes', 'medio'),
  ('UF11', 'Juan Cruz (Malaga)', 'Últimos Fichajes', 'delantero'),
  ('UF12', 'Aubameyang (Deportivo)', 'Últimos Fichajes', 'delantero'),
  ('UF13', 'Sotelo (Celta)', 'Últimos Fichajes', 'medio'),
  ('UF14', 'Sato (Valencia)', 'Últimos Fichajes', 'delantero'),
  ('UF15', 'Fer Niño (Elche)', 'Últimos Fichajes', 'delantero'),
  ('UF16', 'Moscardo (Espanyol)', 'Últimos Fichajes', 'medio'),
  ('UF17', 'Sangante (Sevilla)', 'Últimos Fichajes', 'defensa'),
  ('UF18', 'Andrés García (Getafe)', 'Últimos Fichajes', 'defensa'),
  ('UF19', 'Adeyemi (Barcelona)', 'Últimos Fichajes', 'delantero'),
  ('UF20', 'Kang-In Lee (Atlético de Madrid)', 'Últimos Fichajes', 'medio')
) as item(number, name, team, category)
where collection.slug = 'laliga-este-2026-27'
on conflict (collection_id, number, team) do update
set name = excluded.name,
    category = excluded.category;

update public.collections
set total_stickers = 544,
    is_active = true
where slug = 'laliga-este-2026-27';
