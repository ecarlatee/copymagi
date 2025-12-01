'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';

let socket: Socket;

function SendContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('id');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    if (!roomId) {
      setStatus('No room ID provided. Please scan the QR code again.');
      return;
    }

    socket = io();

    socket.on('connect', () => {
      setStatus('Connected');
      socket.emit('join-room', roomId);
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected');
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [roomId]);

  const handleSendText = () => {
    if (!socket || !roomId || !text.trim()) return;
    socket.emit('send-text', { roomId, text });
    setStatus(`Text sent to room ${roomId}`);
    setText('');
    setTimeout(() => setStatus('Connected'), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 100 * 1024 * 1024) {
        setStatus('File is too large (max 100MB).');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSendFile = () => {
    if (!socket || !roomId || !file) return;

    setStatus('Uploading file...');
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        socket.emit('send-file', {
          roomId,
          file: e.target.result,
          fileName: file.name,
          fileType: file.type,
        });
        setStatus(`File "${file.name}" sent!`);
        setFile(null);
        setTimeout(() => setStatus('Connected'), 3000);
      } else {
        setStatus('Failed to read file.');
        setTimeout(() => setStatus('Connected'), 3000);
      }
    };
    reader.onerror = () => {
      setStatus('Error reading file.');
      setTimeout(() => setStatus('Connected'), 3000);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-md bg-card/50 backdrop-blur-lg border rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Send to Room</h1>
          <p className="text-muted-foreground text-sm font-mono">{roomId}</p>
        </div>

        <div className="w-full space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="w-full h-32 bg-muted/50 border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow duration-300"
          />
          <Button onClick={handleSendText} className="w-full" disabled={!text.trim()}>
            Send Text
          </Button>
        </div>

        <div className="w-full space-y-4">
          <div className="w-full h-32 bg-muted/50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-primary transition-colors" onClick={() => document.getElementById('fileInput')?.click()}>
            <input
              type="file"
              id="fileInput"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="text-sm text-foreground">
                <p className="font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Click to select a file</p>
                <p className="text-xs mt-1">Max 100MB</p>
              </div>
            )}
          </div>
          <Button onClick={handleSendFile} className="w-full" disabled={!file}>
            Send File
          </Button>
        </div>
        
        {status && <p className="text-sm text-muted-foreground mt-4">{status}</p>}
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
