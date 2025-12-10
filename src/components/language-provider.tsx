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
    home: "Home",
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
    infoP1: "This is a project I thought of in class because I wanted to quickly copy text to my PC from my phone.",
    infoP2: "I thought it might be interesting to make it work on any station, any network, etc. so I might as well put it in place if it can be useful. Now, it has a few additional features...",
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
    // Chat & Auth
    secureChat: "Secure Chat",
    encryptedMsg: "End-to-end encrypted messaging. No data stored permanently.",
    createAccount: "Create Account",
    loginKey: "Login with Key",
    importantWarning: "IMPORTANT WARNING",
    warningText: "You are about to create a secure account. Your account is protected by a 12-word secret key. If you lose this key, you lose access to your account forever.",
    understandKey: "I Understand, Create Key",
    cancel: "Cancel",
    secretKey: "Your Secret Key",
    copyWords: "Copy these words and save them somewhere safe. You will need them to log in.",
    chooseUsername: "Choose a Username",
    tagOptional: "Tag is optional. Leave blank for random.",
    savedKey: "I have saved my key, Create Account",
    enterKey: "Enter your 12-word key",
    unlockAccount: "Unlock Account",
    back: "Back",
    online: "Online",
    logout: "Logout",
    addFriendPlaceholder: "Add Friend#1234",
    friendsGroups: "Friends & Groups",
    createGroup: "Create Group",
    groupName: "Group Name",
    create: "Create",
    noFriendsGroups: "No friends or groups yet.",
    selectChat: "Select a friend or group to start chatting",
    typeMessage: "Type a message...",
    send: "Send",
    // Settings
    settings: "Settings",
    fontSize: "Font Size",
    themeColor: "Theme Color",
    small: "Small",
    medium: "Medium",
    large: "Large",
    close: "Close",
    // Profile
    editProfile: "Edit Profile",
    cancelEdit: "Cancel Edit",
    joined: "Joined",
    memberSince: "Member since",
    avatar: "Avatar",
    banner: "Banner",
    bio: "Bio",
    bioPlaceholder: "Tell us about yourself...",
    saveChanges: "Save Changes",
    save: "Save",
    noBio: "No biography yet.",
    connections: "Connections",
    dragAdjust: "Drag to Adjust",
    drag: "Drag",
    dragToReposition: "Drag to Reposition",
    // Admin
    creator: "Creator",
    admin: "Admin",
    adminControls: "Admin Controls",
    deleteUser: "Delete User",
    banUser: "Ban User",
    makeAdmin: "Make Admin",
    revokeAdmin: "Revoke Admin",
    removeAdmin: "Remove Admin",
    // Announcements
    announcements: "Announcements",
    officialAnnouncements: "Official Announcements",
    teamUpdates: "Updates from the team",
    noAnnouncements: "No announcements yet.",
    postAnnouncement: "Post an announcement...",
    post: "Post",
    // Room
    roomName: "Room Name",
    deleteConfirm: "Are you sure you want to delete {username}? This cannot be undone.",
    roleConfirm: "Set {username} role to {role}?",
    invalidFormat: "Please enter username#tag (e.g. User#1234)",
    usernameLength: "Username must be at least 3 characters",
    usernameChars: "Username must contain only letters and numbers",
    tagFormat: "Tag must be exactly 4 digits (e.g. 1234)",
    enterKeyError: "Please enter your 12-word key",
    banConfirm: "Are you sure you want to ban this user?",
    banSuccess: "User banned (simulation)",
  },
  fr: {
    home: "Accueil",
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
    infoP1: "C'est un projet auquel j'ai pensé en cours car je voulais copier rapidement du texte sur mon PC depuis mon téléphone.",
    infoP2: "Je me suis dit que ça pourrait être intéressant de le faire fonctionner sur n'importe quel poste, n'importe quel réseau, etc. donc autant le mettre en place si ça peut être utile. Maintenant, il dispose de quelques fonctionnalités supplémentaires...",
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
    // Chat & Auth
    secureChat: "Chat Sécurisé",
    encryptedMsg: "Messagerie chiffrée de bout en bout. Aucune donnée stockée de manière permanente.",
    createAccount: "Créer un compte",
    loginKey: "Connexion avec Clé",
    importantWarning: "ATTENTION IMPORTANTE",
    warningText: "Vous êtes sur le point de créer un compte sécurisé. Votre compte est protégé par une clé secrète de 12 mots. Si vous perdez cette clé, vous perdez l'accès à votre compte pour toujours.",
    understandKey: "Je comprends, Créer la Clé",
    cancel: "Annuler",
    secretKey: "Votre Clé Secrète",
    copyWords: "Copiez ces mots et gardez-les en lieu sûr. Vous en aurez besoin pour vous connecter.",
    chooseUsername: "Choisir un nom d'utilisateur",
    tagOptional: "Le tag est optionnel. Laissez vide pour un aléatoire.",
    savedKey: "J'ai sauvegardé ma clé, Créer le compte",
    enterKey: "Entrez votre clé de 12 mots",
    unlockAccount: "Déverrouiller le compte",
    back: "Retour",
    online: "En ligne",
    logout: "Déconnexion",
    addFriendPlaceholder: "Ajouter Ami#1234",
    friendsGroups: "Amis & Groupes",
    createGroup: "Créer un Groupe",
    groupName: "Nom du Groupe",
    create: "Créer",
    noFriendsGroups: "Pas encore d'amis ou de groupes.",
    selectChat: "Sélectionnez un ami ou un groupe pour discuter",
    typeMessage: "Écrivez un message...",
    send: "Envoyer",
    // Settings
    settings: "Paramètres",
    fontSize: "Taille de police",
    themeColor: "Couleur du thème",
    small: "Petit",
    medium: "Moyen",
    large: "Grand",
    close: "Fermer",
    // Profile
    editProfile: "Modifier le profil",
    cancelEdit: "Annuler",
    joined: "Rejoint le",
    memberSince: "Membre depuis",
    avatar: "Avatar",
    banner: "Bannière",
    bio: "Bio",
    bioPlaceholder: "Parlez-nous de vous...",
    saveChanges: "Enregistrer",
    save: "Enregistrer",
    noBio: "Pas encore de biographie.",
    connections: "Connexions",
    dragAdjust: "Glisser pour ajuster",
    drag: "Glisser",
    dragToReposition: "Glisser pour repositionner",
    // Admin
    creator: "Créateur",
    admin: "Admin",
    adminControls: "Contrôles Admin",
    deleteUser: "Supprimer l'utilisateur",
    banUser: "Bannir l'utilisateur",
    makeAdmin: "Passer Admin",
    revokeAdmin: "Retirer Admin",
    removeAdmin: "Retirer Admin",
    // Announcements
    announcements: "Annonces",
    officialAnnouncements: "Annonces Officielles",
    teamUpdates: "Mises à jour de l'équipe",
    noAnnouncements: "Pas encore d'annonces.",
    postAnnouncement: "Publier une annonce...",
    post: "Publier",
    // Room
    roomName: "Nom de la Salle",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer {username} ? Cette action est irréversible.",
    roleConfirm: "Définir le rôle de {username} sur {role} ?",
    invalidFormat: "Veuillez entrer nom#tag (ex: User#1234)",
    usernameLength: "Le nom d'utilisateur doit contenir au moins 3 caractères",
    usernameChars: "Le nom d'utilisateur ne doit contenir que des lettres et des chiffres",
    tagFormat: "Le tag doit être exactement 4 chiffres (ex: 1234)",
    enterKeyError: "Veuillez entrer votre clé de 12 mots",
    banConfirm: "Êtes-vous sûr de vouloir bannir cet utilisateur ?",
    banSuccess: "Utilisateur banni (simulation)",
  },
}

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string>) => string
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

  const t = (key: string, params?: Record<string, string>) => {
    let text = translations[language][key] || key
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{${paramKey}}`, paramValue)
      })
    }
    return text
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
