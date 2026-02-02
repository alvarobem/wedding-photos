import type { Metadata } from "next";
import { Cormorant_Garamond, Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marta & Álvaro - Nuestra Boda",
  description: "Comparte los momentos más especiales de nuestra boda",
  openGraph: {
    title: "Marta & Álvaro - Nuestra Boda",
    description: "Comparte los momentos más especiales de nuestra boda",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${cormorant.variable} ${playfair.variable} ${montserrat.variable} antialiased bg-cream text-charcoal`}
      >
        {children}
      </body>
    </html>
  );
}
