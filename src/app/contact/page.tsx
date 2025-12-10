"use client"

import { useLanguage } from "@/components/language-provider"

export default function Contact() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-2xl bg-card/50 backdrop-blur-lg border rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t("contactTitle")}</h1>
        </div>
        <div className="text-center space-y-4">
          <a
            href="https://eyeswoke.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            eyeswoke.com
          </a>
          <a
            href="https://t.me/ec4rlat"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
            >
              <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.863 1.13c-1.192.501-1.797.784-1.919 1.153a1.69 1.69 0 0 0 .533 1.826c.38.305 1.407.667 2.615 1.066.845.279 1.953.646 2.568.828.142.042.217.066.254.075.114.026.242.047.376.063a1.692 1.692 0 0 0 1.325-.457c.025-.023.401-.382 2.597-2.492a132.27 132.27 0 0 1 1.717-1.579c.127-.113.281-.172.447-.169.167.003.326.071.441.191.115.12.168.284.148.451-.02.167-.628 1.876-1.353 3.865-.342.938-.611 1.687-.686 1.894-.075.207-.136.398-.168.54a1.7 1.7 0 0 0 .414 1.321c.35.406.824.543 1.285.57.461.027 1.415-.244 2.718-.664 2.973-.96 4.883-1.575 5.357-1.727.201-.065.356-.198.435-.375.079-.177.096-.38.048-.567L22.41 3.61a2.24 2.24 0 0 0-.212-1.177z" />
            </svg>
          </a>
        </div>
      </main>
    </div>
  );
}
