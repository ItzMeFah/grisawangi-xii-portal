import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GRISAWANGI · Forum Angkatan XII",
  description: "Ruang bersama siswa SMK PGRI 1 Giri Banyuwangi untuk foto angkatan dan persiapan acara.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
