import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CromoNexo — coleccionar, sin complicaciones",
  description: "Organiza tus cromos, encuentra intercambios compatibles y compra o vende con otros coleccionistas.",
  icons: { icon: "/social/foto-perfil-cromonexo.png", apple: "/social/foto-perfil-cromonexo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem("cromonexo-language");document.documentElement.lang=l==="en"?"en":"es";var t=localStorage.getItem("cromonexo-theme");document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
