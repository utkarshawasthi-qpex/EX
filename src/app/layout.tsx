import '@npm-questionpro/wick-ui-lib/dist/style.css';
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Employee Experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
