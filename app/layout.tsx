import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "信息分诊台",
  description: "个人信息流分诊 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
            <Link href="/" className="text-sm font-semibold">
              信息分诊台
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600">
              <Link href="/submit">提交</Link>
              <Link href="/topics">主题</Link>
              <Link href="/library">内容库</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-1">{children}</main>
      </body>
    </html>
  );
}
