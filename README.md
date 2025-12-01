# Copymagi

**Copymagi** is a seamless web application designed to bridge the gap between your devices. Instantly copy and paste text, images, and videos from your phone to your computer (or vice versa) using a simple QR code scan. No apps to install, no accounts to create.

## ✨ Features

- **Instant Transfer**: Real-time communication using WebSockets.
- **Cross-Device**: Works on any device with a web browser.
- **Rich Media Support**: Send text, images, and videos.
- **Zero Setup**: Just scan a QR code to connect.
- **Secure & Private**: Unique, temporary sessions.
- **Modern UI**: Beautiful, glassmorphism-inspired interface.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ecarlatee/copymagi.git
   cd copymagi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

To test across devices locally, ensure both devices are on the same network and access the server via your machine's local IP address (e.g., `http://192.168.1.x:3000`).

## 🌐 Deployment

This project is ready to be deployed on platforms like [Render](https://render.com), [Vercel](https://vercel.com), or [Railway](https://railway.app).

**Recommended Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 👤 Author

Created by **Ecarlate**.
Visit [eyeswoke.com](https://eyeswoke.com).
