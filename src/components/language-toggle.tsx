"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(language === "en" ? "fr" : "en")}
      title={language === "en" ? "Switch to French" : "Passer en Anglais"}
    >
      <span className="text-xl">{language === "en" ? "🇬🇧" : "🇫🇷"}</span>
      <span className="sr-only">Toggle language</span>
    </Button>
  )
}
