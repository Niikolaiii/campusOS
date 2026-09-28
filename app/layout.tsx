import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusOps | Smart Building Monitor",
  description: "Monitor campus equipment, environmental conditions and maintenance operations.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>}
