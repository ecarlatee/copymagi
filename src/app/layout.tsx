import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Copimagi",
  description: "Copy paste between devices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <div className="flex-grow">{children}</div>
        <footer className="w-full py-6 text-center text-sm text-gray-500 border-t border-gray-200 dark:border-gray-800">
          <p>
            Created by{" "}
            <a
              href="https://eyeswoke.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              eyeswoke.com
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
