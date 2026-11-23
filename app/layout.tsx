import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Amigo Secreto da Família",
  description: "Nosso sorteio de fim de ano"
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
