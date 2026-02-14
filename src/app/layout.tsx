import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Likit – Nakit Akış Takibi",
  description: "Nakit akışınızı kolayca takip edin. Gelir, gider ve bakiye tahminlerinizi tek bir ekranda görün.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        {children}
      </body>
    </html>
  );
}
