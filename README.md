# Copimagi

Copimagi is a web application that allows you to copy and paste text, images, and videos between devices (e.g., from phone to computer) instantly using QR codes and WebSockets.

## Features

- **Receiver (Computer)**: Generates a unique session and displays a QR code.
- **Sender (Phone)**: Scans the QR code to join the session and send text or files.
- **Real-time**: Text and files are transferred instantly via WebSockets.
- **File Support**: Send images and videos directly from your phone gallery.
- **Secure**: Sessions are temporary and unique.

## Getting Started (Local)

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

To use it with your phone on the same Wi-Fi network:
1. Find your computer's local IP address (e.g., `192.168.1.x`).
2. Open `http://YOUR_LOCAL_IP:3000` on your computer.
3. Scan the QR code with your phone to start sending text or files.

## Deployment (Public Access)

To use Copimagi from anywhere (without being on the same Wi-Fi), deploy it to a service like Render or Railway.

1. Push your code to GitHub.
2. Create a new Web Service on [Render](https://render.com).
3. Connect your repository.
4. Use the following settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Once deployed, open the provided URL on your computer and scan the QR code with your phone.

## Tech Stack

- Next.js 14
- Socket.io (with 100MB buffer for files)
- Tailwind CSS
- TypeScript
