'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

function SendContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('Connecting...');
  const [sent, setSent] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) {
      setStatus('No ID provided. Please scan the QR code again.');
      return;
    }

    socket = io();

    socket.on('connect', () => {
      setStatus('Connected to ' + id);
      socket.emit('join-room', id);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id]);

  const handleSend = () => {
    if (!socket || !id) return;

    if (text) {
      socket.emit('send-text', { roomId: id, text });
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    }

    if (file) {
      setUploading(true);
      // Read file as buffer
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          socket.emit('send-file', {
            roomId: id,
            file: e.target.result,
            fileName: file.name,
            fileType: file.type
          });
          setUploading(false);
          setSent(true);
          setTimeout(() => setSent(false), 2000);
          setFile(null); // Reset file input
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center sm:text-left">Copimagi Sender</h1>
        <p className="text-lg text-center sm:text-left">{status}</p>

        <div className="w-full flex flex-col gap-4">
          <textarea
            className="w-full h-40 p-4 border border-gray-300 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white"
            placeholder="Type or paste text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <label className="font-semibold">Or select a file (Image/Video):</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {file && <p className="text-sm text-gray-600">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>
        </div>

        <button
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            sent ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSend}
          disabled={(!id || (!text && !file)) || uploading}
        >
          {uploading ? 'Sending File...' : sent ? 'Sent!' : 'Send'}
        </button>
      </main>
    </div>
  );
}

export default function Send() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SendContent />
    </Suspense>
  );
}
