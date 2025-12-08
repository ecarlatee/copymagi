import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { HeaderContent } from "@/components/header-content";
import { FooterContent } from "@/components/footer-content";
import Link from "next/link";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "600", "700"] 
});

export const metadata: Metadata = {
  title: "Copymagi",
  description: "Copy paste between devices instantly. Share text, images, and videos across phones and computers with a simple QR code.",
  keywords: ["copy paste", "clipboard sync", "file transfer", "cross-device", "QR code", "share text", "share files", "Copymagi"],
  openGraph: {
    title: "Copymagi - Seamless Cross-Device Copy Paste",
    description: "Instantly transfer text and files between devices without login.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} flex flex-col min-h-screen`}>
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <HeaderContent />
            <div className="flex-grow">{children}</div>
            <FooterContent />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
