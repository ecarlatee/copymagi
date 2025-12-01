import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "600", "700"] 
});

export const metadata: Metadata = {
  title: "Copymagi",
  description: "Copy paste between devices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="w-full p-4 flex justify-between items-center">
            <Link href="/" className="font-bold text-xl hover:opacity-80 transition-opacity">
              Copymagi
            </Link>
            <div className="flex items-center gap-4">
              <nav className="flex gap-4">
                <Link href="/info" className="text-sm font-medium hover:underline">Info</Link>
                <Link href="/contact" className="text-sm font-medium hover:underline">Contact</Link>
              </nav>
              <ModeToggle />
            </div>
          </header>
          <div className="flex-grow">{children}</div>
          <footer className="w-full py-6 text-center text-xs text-gray-500 border-t">
            <p>&copy; {new Date().getFullYear()} Copymagi. All Rights Reserved.</p>
            <p>
              Created by{" "}
              <a
                href="https://eyeswoke.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                eyeswoke.com
              </a>
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
