// layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatWidget } from "@/components/ChatWidget";
import Header from "./Header";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CraftSigns",
  description: "Рекламо производственная компания CraftSigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Header />
          {children}
          <ScrollToTop />
          <ChatWidget />
          <footer className="border-t border-white/10 bg-[#050505] py-6">
            <div className="app-shell text-sm text-zinc-600">CraftSigns</div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
