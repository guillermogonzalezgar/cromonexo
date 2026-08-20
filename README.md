# CromoNexo

MVP mobile-first para gestionar cromos y encontrar intercambios compatibles.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
npm run dev
```

Después, crea un proyecto en Supabase, copia `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`, y aplica en orden las migraciones de `supabase/migrations`.

## Comandos útiles

```bash
npm run dev
npm run build
npm run lint
```

La pantalla `/mi-coleccion` funciona ahora con datos de demostración para validar la experiencia antes de conectar Supabase. El catálogo permanece interno y solo aparecen los cromos marcados como `wanted` o `duplicate`.
