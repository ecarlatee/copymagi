"use client"

import { useLanguage } from "@/components/language-provider"

export default function Info() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-2xl bg-card/50 backdrop-blur-lg border rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t("infoTitle")}</h1>
        </div>
        <div className="text-left space-y-4 text-muted-foreground">
            <p>{t("infoP1")}</p>
            <p>{t("infoP2")}</p>
            <p>{t("infoP3")}</p>
        </div>
      </main>
    </div>
  );
}
