"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "fr"

type Translations = {
  [key in Language]: {
    [key: string]: string
  }
}

const translations: Translations = {
  en: {
    info: "Info",
    contact: "Contact",
    footerRights: "All Rights Reserved.",
    connecting: "Connecting...",
    connected: "Connected. Scan the QR code to send text or files.",
    sendUrl: "Send to Room",
    typePlaceholder: "Type or paste your text here...",
    sendText: "Send Text",
    clickToSelect: "Click to select a file",
    maxSize: "Max 100MB",
    sendFile: "Send File",
    receivedText: "Received Text",
    receivedFile: "Received File",
    download: "Download",
    copiedClipboard: "Copied to clipboard automatically!",
    failedCopy: "Failed to copy automatically. Please copy manually.",
    clipboardNotAvailable: "Clipboard API not available. Please copy manually.",
    fileReceived: "File received!",
    linkCopied: "Link copied!",
    clickToCopy: "Click to copy link",
    infoTitle: "Info",
    infoP1: "This is a project I thought of in class because I wanted to paste text on my PC from my phone.",
    infoP2: "I thought it might be interesting to make it work on any station, any network, etc. so I might as well put it in place if it can be useful.",
    infoP3: "The site does not store any data. The transfer is done in real time and nothing is kept on the server.",
    contactTitle: "Contact",
    noRoomId: "No room ID provided. Please scan the QR code again.",
    disconnected: "Disconnected",
    textSent: "Text sent to room",
    fileTooLarge: "File is too large (max 100MB).",
    uploading: "Uploading file...",
    fileSent: "File sent!",
    failedRead: "Failed to read file.",
    errorRead: "Error reading file.",
    searchNearby: "Search Nearby Rooms",
    noNearbyFound: "No nearby rooms found.",
    joinRoom: "Join Room",
    nearbyRooms: "Nearby Rooms",
  },
  fr: {
    info: "Info",
    contact: "Contact",
    footerRights: "Tous droits réservés.",
    connecting: "Connexion...",
    connected: "Connecté. Scannez le QR code pour envoyer du texte ou des fichiers.",
    sendUrl: "Envoyer vers la salle",
    typePlaceholder: "Tapez ou collez votre texte ici...",
    sendText: "Envoyer le texte",
    clickToSelect: "Cliquez pour sélectionner un fichier",
    maxSize: "Max 100Mo",
    sendFile: "Envoyer le fichier",
    receivedText: "Texte reçu",
    receivedFile: "Fichier reçu",
    download: "Télécharger",
    copiedClipboard: "Copié dans le presse-papiers automatiquement !",
    failedCopy: "Échec de la copie automatique. Veuillez copier manuellement.",
    clipboardNotAvailable: "API presse-papiers non disponible. Veuillez copier manuellement.",
    fileReceived: "Fichier reçu !",
    linkCopied: "Lien copié !",
    clickToCopy: "Cliquez pour copier le lien",
    infoTitle: "Info",
    infoP1: "C'est un projet auquel j'ai pensé en cours car je voulais coller du texte sur mon PC depuis mon téléphone.",
    infoP2: "Je me suis dit que ça pourrait être intéressant de le faire fonctionner sur n'importe quel poste, n'importe quel réseau, etc. donc autant le mettre en place si ça peut être utile.",
    infoP3: "Le site ne stocke aucune donnée. Le transfert se fait en temps réel et rien n'est conservé sur le serveur.",
    contactTitle: "Contact",
    noRoomId: "Aucun ID de salle fourni. Veuillez scanner le QR code à nouveau.",
    disconnected: "Déconnecté",
    textSent: "Texte envoyé à la salle",
    fileTooLarge: "Le fichier est trop volumineux (max 100Mo).",
    uploading: "Envoi du fichier...",
    fileSent: "Fichier envoyé !",
    failedRead: "Échec de la lecture du fichier.",
    errorRead: "Erreur lors de la lecture du fichier.",
    searchNearby: "Rechercher des salles à proximité",
    noNearbyFound: "Aucune salle trouvée à proximité.",
    joinRoom: "Rejoindre la salle",
    nearbyRooms: "Salles à proximité",
  },
}

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const browserLang = navigator.language.split("-")[0]
    if (browserLang === "fr") {
      setLanguage("fr")
    }
  }, [])

  const t = (key: string) => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
