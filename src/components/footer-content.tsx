"use client"

import { useLanguage } from "@/components/language-provider"

export function FooterContent() {
  const { t } = useLanguage()

  return (
    <footer className="w-full py-6 text-center text-xs text-gray-500 border-t">
      <p>&copy; {new Date().getFullYear()} Copymagi. {t("footerRights")}</p>
    </footer>
  )
}
