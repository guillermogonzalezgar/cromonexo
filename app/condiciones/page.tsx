import LegalShell from "@/components/legal-shell";

export default function TermsPage() {
  return <LegalShell title="Condiciones de uso" intro="Reglas básicas para participar de forma segura en la comunidad CromoNexo.">
    <section><h2>1. Requisitos</h2><p>Debes tener al menos 14 años, proporcionar información correcta y proteger el acceso a tu cuenta. No puedes suplantar a otra persona ni crear cuentas para eludir medidas de seguridad.</p></section>
    <section><h2>2. Uso permitido</h2><p>Puedes gestionar colecciones, proponer intercambios y publicar cromos que realmente poseas. Queda prohibido publicar falsificaciones, artículos robados, contenido ilegal o engañoso, acosar a otros usuarios o manipular valoraciones y compatibilidades.</p></section>
    <section><h2>3. Intercambios y compraventas</h2><p>Cada acuerdo se celebra entre comprador y vendedor o entre quienes intercambian. En las operaciones habilitadas, Stripe procesa el pago y verifica los datos necesarios para abonar al vendedor. CromoNexo aplica una comisión del 5 % del precio del cromo, con un mínimo de 0,10 €. Los gastos de envío se muestran antes de pagar. El vendedor es responsable de preparar el paquete, contratar el transporte indicado y facilitar un seguimiento correcto. La aportación de fotografías y un código temporal acredita únicamente que se presentaron imágenes vinculadas al anuncio; no constituye una certificación oficial de autenticidad, estado o valor.</p></section>
    <section><h2>4. Seguridad</h2><ul><li>No envíes dinero fuera de un método que ofrezca protección.</li><li>No compartas contraseñas, códigos de acceso ni documentación innecesaria.</li><li>Conserva la conversación y pruebas del acuerdo.</li><li>Denuncia anuncios o comportamientos sospechosos.</li></ul></section>
    <section><h2>5. Moderación</h2><p>CromoNexo puede retirar anuncios, limitar funciones o suspender cuentas ante indicios razonables de fraude, abuso, incumplimiento o riesgo para la comunidad.</p></section>
    <section><h2>6. Cambios y baja</h2><p>Las condiciones pueden actualizarse para reflejar nuevas funciones o requisitos legales. Puedes dejar de usar el servicio y solicitar la eliminación de tu cuenta y datos conforme a la política de privacidad.</p></section>
  </LegalShell>;
}
