import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orthopedic Implant Analytics Dashboard",
  description: "Professional sales analytics for orthopedic implants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
