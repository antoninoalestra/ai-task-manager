import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Task Manager",
  description: "Gestione intelligente di impegni, eventi e task vocali in stile Apple Calendar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Task Manager",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100 selection:bg-blue-500/30" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}