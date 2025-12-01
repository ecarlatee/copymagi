'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';

let socket: Socket;

export default function Home() {
  const [roomId, setRoomId] = useState<string>('');
  const [receivedText, setReceivedText] = useState<string>('');
  const [receivedFile, setReceivedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');
  const [copyStatus, setCopyStatus] = useState<string>('');

  useEffect(() => {
    const id = uuidv4();
    setRoomId(id);

    // Initialize socket connection
    // We use the same host as the page
    socket = io();

    socket.on('connect', () => {
      setStatus('Connected. Scan the QR code to send text or files.');
      socket.emit('join-room', id);
    });

    socket.on('receive-text', (text: string) => {
      setReceivedText(text);
      setReceivedFile(null); // Clear previous file
      // Try to copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setCopyStatus('Copied to clipboard automatically!');
          setTimeout(() => setCopyStatus(''), 3000);
        }).catch((err) => {
          console.error('Clipboard write failed', err);
          setCopyStatus('Failed to copy automatically. Please copy manually.');
        });
      } else {
         setCopyStatus('Clipboard API not available. Please copy manually.');
      }
    });

    socket.on('receive-file', ({ file, fileName, fileType }: { file: ArrayBuffer; fileName: string; fileType: string }) => {
      const blob = new Blob([file], { type: fileType });
      const url = URL.createObjectURL(blob);
      setReceivedFile({ url, name: fileName, type: fileType });
      setReceivedText(''); // Clear previous text
      setCopyStatus('File received!');
      setTimeout(() => setCopyStatus(''), 3000);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const sendUrl = typeof window !== 'undefined' ? `${window.location.origin}/send?id=${roomId}` : '';

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center sm:text-left">Copimagi Receiver</h1>
        <p className="text-lg text-center sm:text-left">{status}</p>

        {roomId && (
          <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow-md">
            <QRCodeSVG value={sendUrl} size={256} />
            <p className="text-sm text-gray-500 break-all text-center">{sendUrl}</p>
          </div>
        )}

        {receivedText && (
          <div className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-2">Received Text:</h2>
            <pre className="whitespace-pre-wrap break-words p-4 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
              {receivedText}
            </pre>
            {copyStatus && <p className="mt-2 text-green-600 font-medium">{copyStatus}</p>}
          </div>
        )}

        {receivedFile && (
          <div className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-2">Received File: {receivedFile.name}</h2>
            <div className="flex flex-col gap-4 items-center">
              {receivedFile.type.startsWith('image/') ? (
                <img src={receivedFile.url} alt={receivedFile.name} className="max-w-full max-h-96 rounded" />
              ) : receivedFile.type.startsWith('video/') ? (
                <video src={receivedFile.url} controls className="max-w-full max-h-96 rounded" />
              ) : (
                <div className="p-8 bg-gray-200 dark:bg-gray-700 rounded text-center">
                  File type not previewable
                </div>
              )}
              <a
                href={receivedFile.url}
                download={receivedFile.name}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Download {receivedFile.name}
              </a>
            </div>
            {copyStatus && <p className="mt-2 text-green-600 font-medium">{copyStatus}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
