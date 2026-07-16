import type { Metadata } from "next";
import { Archivo_Black, Work_Sans } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
});

const workSans = Work_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-work-sans",
});

export const metadata: Metadata = {
  title: "Shoot & Scale — Content Engine",
  description: "Shoot & Scale's content engine chat, guide, and admin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivoBlack.variable} ${workSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
