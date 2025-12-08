'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';

let socket: Socket;

function SendContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('id');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('Connecting...');
  const [receivedText, setReceivedText] = useState<string>('');
  const [receivedFile, setReceivedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('');

  useEffect(() => {
    setStatus(t('connecting'));
  }, [t]);

  useEffect(() => {
    if (!roomId) {
      setStatus(t('noRoomId'));
      return;
    }

    socket = io();

    socket.on('connect', () => {
      setStatus(t('connected'));
      socket.emit('join-room', roomId);
    });

    socket.on('receive-text', (text: string) => {
      setReceivedText(text);
      setReceivedFile(null);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setCopyStatus(t('copiedClipboard'));
          setTimeout(() => setCopyStatus(''), 3000);
        }).catch((err) => {
          console.error('Clipboard write failed', err);
          setCopyStatus(t('failedCopy'));
        });
      } else {
         setCopyStatus(t('clipboardNotAvailable'));
      }
    });

    socket.on('receive-file', ({ file, fileName, fileType }: { file: ArrayBuffer; fileName: string; fileType: string }) => {
      const blob = new Blob([file], { type: fileType });
      const url = URL.createObjectURL(blob);
      setReceivedFile({ url, name: fileName, type: fileType });
      setReceivedText('');
      setCopyStatus(t('fileReceived'));
      setTimeout(() => setCopyStatus(''), 3000);
    });

    socket.on('disconnect', () => {
      setStatus(t('disconnected'));
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [roomId, t]);

  const handleSendText = () => {
    if (!socket || !roomId || !text.trim()) return;
    socket.emit('send-text', { roomId, text });
    setStatus(`${t('textSent')} ${roomId}`);
    setText('');
    setTimeout(() => setStatus(t('connected')), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 100 * 1024 * 1024) {
        setStatus(t('fileTooLarge'));
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSendFile = () => {
    if (!socket || !roomId || !file) return;

    setStatus(t('uploading'));
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        socket.emit('send-file', {
          roomId,
          file: e.target.result,
          fileName: file.name,
          fileType: file.type,
        });
        setStatus(`${t('fileSent')} "${file.name}"`);
        setFile(null);
        setTimeout(() => setStatus(t('connected')), 3000);
      } else {
        setStatus(t('failedRead'));
        setTimeout(() => setStatus(t('connected')), 3000);
      }
    };
    reader.onerror = () => {
      setStatus(t('errorRead'));
      setTimeout(() => setStatus(t('connected')), 3000);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-md bg-card/50 backdrop-blur-lg border rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t('sendUrl')}</h1>
          <p className="text-muted-foreground text-sm font-mono">{roomId}</p>
        </div>

        <div className="w-full space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('typePlaceholder')}
            className="w-full h-32 bg-muted/50 border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow duration-300"
          />
          <Button onClick={handleSendText} className="w-full" disabled={!text.trim()}>
            {t('sendText')}
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
                <p>{t('clickToSelect')}</p>
                <p className="text-xs mt-1">{t('maxSize')}</p>
              </div>
            )}
          </div>
          <Button onClick={handleSendFile} className="w-full" disabled={!file}>
            {t('sendFile')}
          </Button>
        </div>
        
        {status && <p className="text-sm text-muted-foreground mt-4">{status}</p>}

        {receivedText && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
            <div className="bg-muted/50 border rounded-xl p-4 relative group">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('receivedText')}</h2>
              <pre className="whitespace-pre-wrap break-words text-sm font-mono text-foreground max-h-60 overflow-y-auto custom-scrollbar">
                {receivedText}
              </pre>
              {copyStatus && (
                <div className="absolute top-2 right-2 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  {copyStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {receivedFile && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
            <div className="bg-muted/50 border rounded-xl p-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('receivedFile')}</h2>
              <div className="flex flex-col gap-4 items-center">
                {receivedFile.type.startsWith('image/') ? (
                  <img src={receivedFile.url} alt={receivedFile.name} className="w-full rounded-lg border" />
                ) : receivedFile.type.startsWith('video/') ? (
                  <video src={receivedFile.url} controls className="w-full rounded-lg border" />
                ) : (
                  <div className="p-8 bg-card/50 rounded-lg text-center w-full border">
                    <span className="text-4xl">📄</span>
                    <p className="mt-2 text-sm text-muted-foreground">{receivedFile.name}</p>
                  </div>
                )}
                <a
                  href={receivedFile.url}
                  download={receivedFile.name}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full py-3 rounded-xl font-semibold text-center text-sm"
                >
                  {t('download')} {receivedFile.name}
                </a>
              </div>
              {copyStatus && <p className="mt-2 text-green-400 text-xs text-center">{copyStatus}</p>}
            </div>
          </div>
        )}
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
