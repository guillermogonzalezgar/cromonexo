import LegalShell, { LegalIdentity } from "@/components/legal-shell";

export default function PrivacyPage() {
  return <LegalShell title="Política de privacidad" intro="Explica qué datos personales tratamos, para qué los utilizamos y cómo puedes ejercer tus derechos.">
    <section><h2>1. Responsable</h2><LegalIdentity/></section>
    <section><h2>2. Datos y finalidades</h2><ul><li><strong>Lista de espera:</strong> correo, alias y ciudad opcional para gestionar el acceso a la beta.</li><li><strong>Cuenta:</strong> correo, perfil, inventario y actividad necesaria para prestar el servicio.</li><li><strong>Mercado e intercambios:</strong> anuncios, propuestas, mensajes breves y denuncias para conectar usuarios y mantener la seguridad.</li><li><strong>Seguridad:</strong> registros técnicos imprescindibles para prevenir abuso y resolver incidencias.</li></ul></section>
    <section><h2>3. Base jurídica</h2><p>El consentimiento permite gestionar la lista de espera. La ejecución de las condiciones de uso permite prestar las funciones solicitadas por usuarios registrados. El interés legítimo permite proteger el servicio frente a fraude y abuso.</p></section>
    <section><h2>4. Conservación</h2><p>Los datos de la lista se conservarán hasta el lanzamiento de la beta o hasta que retires tu consentimiento. Los datos de cuenta se conservarán mientras siga activa y durante los plazos necesarios para atender responsabilidades legales.</p></section>
    <section><h2>5. Proveedores</h2><p>Utilizamos Supabase para base de datos y autenticación y, al publicar, Vercel para alojamiento. Estos proveedores actúan como encargados del tratamiento conforme a sus condiciones y garantías aplicables.</p></section>
    <section><h2>6. Derechos</h2><p>Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad escribiendo al correo indicado. También puedes reclamar ante la Agencia Española de Protección de Datos.</p></section>
    <section><h2>7. Menores</h2><p>La beta está dirigida a personas de 14 años o más. Los menores de 14 años no deben registrarse ni enviar datos sin la autorización verificable de sus representantes legales.</p></section>
    <section><h2>8. Cookies</h2><p>Actualmente solo utilizamos almacenamiento y cookies técnicas necesarias para la autenticación y seguridad. No instalamos cookies publicitarias ni analíticas de terceros. Si esto cambia, se solicitará el consentimiento correspondiente.</p></section>
  </LegalShell>;
}
