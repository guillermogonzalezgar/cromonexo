import LegalShell, { LegalIdentity } from "@/components/legal-shell";

export default function LegalNoticePage() {
  return <LegalShell title="Aviso legal" intro="Información sobre el titular y las reglas generales de acceso a CromoNexo.">
    <section><h2>1. Titular del servicio</h2><LegalIdentity/></section>
    <section><h2>2. Objeto</h2><p>CromoNexo es una plataforma tecnológica para que coleccionistas gestionen faltantes y repetidos, encuentren compatibilidades y publiquen anuncios. En la beta no procesa pagos ni organiza envíos.</p></section>
    <section><h2>3. Intermediación</h2><p>Los intercambios y compraventas se acuerdan directamente entre usuarios. CromoNexo no es parte del contrato, no custodia productos ni garantiza la identidad, disponibilidad o estado de los cromos anunciados.</p></section>
    <section><h2>4. Propiedad intelectual</h2><p>La marca, diseño y software de CromoNexo están protegidos. Las marcas de editoriales, competiciones y clubes pertenecen a sus titulares. CromoNexo no está afiliado ni patrocinado por Panini, LALIGA o sus clubes.</p></section>
    <section><h2>5. Responsabilidad</h2><p>Se aplican medidas razonables de seguridad y moderación, pero no puede garantizarse un servicio ininterrumpido ni la veracidad de todo contenido publicado por terceros. Los anuncios sospechosos pueden denunciarse desde el mercado.</p></section>
  </LegalShell>;
}
