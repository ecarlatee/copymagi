"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/components/language-provider"

export function HeaderContent() {
  const { t } = useLanguage()

  return (
    <header className="w-full p-4 flex justify-between items-center">
      <Link href="/" className="font-bold text-xl hover:opacity-80 transition-opacity">
        Copymagi
      </Link>
      <div className="flex items-center gap-4">
        <nav className="flex gap-4">
          <Link href="/info" className="text-sm font-medium hover:underline">
            {t("info")}
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:underline">
            {t("contact")}
          </Link>
        </nav>
        <LanguageToggle />
        <ModeToggle />
      </div>
    </header>
  )
}
