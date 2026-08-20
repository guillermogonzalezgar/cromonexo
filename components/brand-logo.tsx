import Image from "next/image";

export default function BrandLogo({ className = "" }: { className?: string }) {
  return <span className={`brand-logo ${className}`} aria-hidden="true">
    <Image src="/social/foto-perfil-cromonexo.png" alt="" fill sizes="48px" priority />
  </span>;
}
