"use client"

import Link from "next/link"
import { useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"

export function HeaderContent() {
  const { t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="w-full p-4 border-b">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
        <div className="w-full md:w-auto flex justify-between items-center">
          <Link href="/" className="font-bold text-xl hover:opacity-80 transition-opacity">
            Copymagi
          </Link>
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕' : '☰'}
          </Button>
        </div>

        <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 w-full md:w-auto animate-in slide-in-from-top-2 md:animate-none`}>
          <nav className="flex flex-col md:flex-row gap-4 items-center text-center">
            <Link href="/" className="text-sm font-medium hover:underline" onClick={() => setIsMenuOpen(false)}>
              {t("home")}
            </Link>
            <Link href="/info" className="text-sm font-medium hover:underline" onClick={() => setIsMenuOpen(false)}>
              {t("info")}
            </Link>
            <Link href="/chat" className="text-sm font-medium hover:underline" onClick={() => setIsMenuOpen(false)}>
              Chat
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:underline" onClick={() => setIsMenuOpen(false)}>
              {t("contact")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
