# Publicar pagos, envíos manuales y tercera edición

Cambios locales preparados y revisados el 4 de octubre de 2026. La tercera edición añade 45 cromos y completa 7 huecos: el catálogo pasa de 544 a 589, conservando las marcas de los usuarios. No se han publicado ni se han realizado cobros reales.

## 1. Actualizar Supabase antes de publicar

En Terminal:

```bash
cd /Users/guillermogonzalezgarcia/Desktop/CROMOSWAP
cat supabase/migrations/202610030001_manual_tracked_shipping.sql \
  supabase/migrations/202610040001_update_laliga_2026_27_third_edition.sql | pbcopy
open "https://supabase.com/dashboard/project/tthsbxoxywrcwdimeehh/sql/new"
```

En el editor SQL que se abre, pega con Cmd+V y pulsa **Run**. Espera a que termine correctamente antes del paso 2. Ambos SQL son repetibles y mantienen los pedidos anteriores y las colecciones de los usuarios. Si aparece un error, no continúes con la publicación; copia el error completo para revisarlo. No uses `db push --include-all` para este cambio: las migraciones antiguas pueden haberse aplicado manualmente.

## 2. Subir los archivos preparados

```bash
cd /Users/guillermogonzalezgarcia/Desktop/CROMOSWAP

git add app/api/stripe/connect/route.ts app/api/stripe/checkout/route.ts \
  app/api/envios app/api/admin/envios app/admin/envios \
  app/mercado/solicitudes/page.tsx app/mercado/solicitudes/payment-actions.tsx \
  app/mercado/solicitudes/managed-shipping.tsx \
  app/ayuda/page.tsx app/condiciones/page.tsx app/privacidad/page.tsx \
  lib/market-policy.ts lib/stripe.ts lib/manual-shipping.ts \
  lib/shipping-admin.ts lib/shipping-orders.ts \
  eslint.config.mjs package.json package-lock.json \
  tests/market-payments.test.mjs \
  supabase/migrations/202610030001_manual_tracked_shipping.sql \
  supabase/migrations/202610040001_update_laliga_2026_27_third_edition.sql \
  docs/publicar-envios-manuales.md public/social/20-pagos-activados.png

git diff --cached --stat
git commit -m "Añadir tercera edición y configurar pagos y envíos" && git push origin main
```

No se añaden fotos sueltas, temporales, claves ni el entorno local. Netlify debe mostrar **Published** para que el cambio esté en la web. Si el despliegue falla, revisa el registro; un push a GitHub no equivale a una publicación correcta.

## 3. Gestionar los envíos

Inicia sesión con **comunicacion@cromonexo.com**, con el correo verificado. No se crea una cuenta ni se modifica su contraseña. Accede a **Solicitudes y pedidos → Gestionar envíos** o a `https://cromonexo.com/admin/envios`.

1. El comprador paga el cromo y 3,99 € si escoge seguimiento y el cromo cuesta más de 5 €.
2. El vendedor introduce su dirección y teléfono como remitente.
3. En el panel privado ves remitente, destinatario y teléfono. Contratas Correos manualmente fuera de CromoNexo.
4. Subes el PDF de Correos y el número de seguimiento al pedido.
5. El vendedor descarga su etiqueta, prepara el paquete y confirma cuándo lo entrega en Correos.
6. El comprador puede confirmar la recepción.

La web no contrata ni paga a Correos automáticamente, no envía correos de aviso y no consulta automáticamente eventos de entrega. Revisa el panel para ver pedidos nuevos.

## Reparto del dinero

- Comisión: 5 % del precio del cromo, mínimo 0,10 €, redondeado a céntimos.
- Nuevos pedidos con seguimiento: CromoNexo conserva los 3,99 € de transporte **además de** su comisión. No es una segunda comisión; sirve para pagar el envío que contratas.
- Carta con sello: el vendedor conserva los 1,49 € para comprar el sello y pulsa «Carta enviada».
- Entrega en mano: no cobra envío ni pide confirmar entrega o recepción; la comisión de venta se mantiene.
- La comisión registrada en la base de datos sigue separada de los gastos de transporte. Stripe agrupa ambos importes retenidos en `application_fee_amount`; sus gastos de procesamiento se descuentan del saldo de CromoNexo.
- Ejemplo: cromo de 10 € con seguimiento. Comprador paga 13,99 €, vendedor recibe 9,50 € y CromoNexo retiene 4,49 € antes de gastos de Stripe (0,50 € de comisión + 3,99 € para Correos).
- Los pedidos creados con la versión anterior conservan su gestión original: esos gastos ya se enviaban al vendedor. No se retienen fondos retroactivamente.

## Comprobaciones de publicación

La cuenta administradora debe tener el correo confirmado en Supabase. Los datos y etiquetas solo son accesibles para las cuentas autorizadas, también a nivel de base de datos.

Conserva la configuración de Stripe de Netlify. El webhook de pagos existente necesita `STRIPE_WEBHOOK_SECRET` y `SUPABASE_SERVICE_ROLE_KEY`; no publiques claves en GitHub. Las nuevas pantallas usan la sesión autenticada y no necesitan una nueva clave administrativa. No se ha comprobado aquí la configuración remota ni un cobro real.

Verifica un pedido completo en modo de prueba antes de anunciarlo. La imagen `public/social/20-pagos-activados.png` está preparada para publicar cuando los pagos y el despliegue estén operativos.

## Cuenta para recibir las comisiones

No envíes tu IBAN por el chat. En la cuenta de Stripe de CromoNexo, añade tu cuenta bancaria en Configuración → Cuentas bancarias y calendario de transferencias (https://dashboard.stripe.com/settings/money-management). Las comisiones se acumulan en el saldo de esa cuenta de Stripe y se transfieren a la cuenta bancaria configurada. Los gastos de Stripe se descuentan de ese saldo.

## Verificar la tercera edición

Abre la colección LaLiga ESTE 2026/27 · 3.ª edición: debe mostrar 589 cromos si partías del catálogo anterior de 544. Busca UF40 Rodri, UF21 Bernardo Silva y 20BIS Mariano del Alavés. Comprueba que tus marcas de tengo/repetidos siguen como antes.

La migración corrige también Maguette (Racing, 11), Nteka (Rayo, 11B), Pedro Díaz (Rayo, 11A) y los nombres completos de Rodri Mendoza en Draft 23/Kromix. Conserva los identificadores. El total se calcula a partir del catálogo existente, por lo que incluye posibles cromos adicionales añadidos manualmente.

Validación local: actualización ejecutada dos veces en PostgreSQL de prueba, 544 identificadores y marcas conservados; 45 altas, 7 huecos completados, total 589. Las 13 pruebas de pagos y envíos pasan. No se ha ejecutado SQL en producción ni realizado cobros reales.
