'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '@/components/language-provider';

let socket: Socket;

export default function Home() {
  const { t } = useLanguage();
  const [roomId, setRoomId] = useState<string>('');
  const [receivedText, setReceivedText] = useState<string>('');
  const [receivedFile, setReceivedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [urlCopyStatus, setUrlCopyStatus] = useState<string>('');

  useEffect(() => {
    setStatus(t('connecting'));
  }, [t]);

  useEffect(() => {
    const id = uuidv4();
    setRoomId(id);

    // Initialize socket connection
    // We use the same host as the page
    socket = io();

    socket.on('connect', () => {
      setStatus(t('connected'));
      socket.emit('join-room', id);
    });

    socket.on('receive-text', (text: string) => {
      setReceivedText(text);
      setReceivedFile(null); // Clear previous file
      // Try to copy to clipboard
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
      setReceivedText(''); // Clear previous text
      setCopyStatus(t('fileReceived'));
      setTimeout(() => setCopyStatus(''), 3000);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [t]);

  const sendUrl = typeof window !== 'undefined' ? `${window.location.origin}/send?id=${roomId}` : '';

  const handleCopyUrl = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(sendUrl).then(() => {
        setUrlCopyStatus(t('linkCopied'));
        setTimeout(() => setUrlCopyStatus(''), 2000);
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-md bg-card/50 backdrop-blur-lg border rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Copymagi</h1>
          <p className="text-muted-foreground text-sm">{status}</p>
        </div>

        {roomId && (
          <div className="relative overflow-hidden flex flex-col items-center gap-4 p-6 bg-card/70 rounded-2xl shadow-inner w-full border">
            <div className="qr-reflection" />
            <QRCodeSVG value={sendUrl} size={200} className="w-full h-auto max-w-[200px] rounded-lg relative z-10" bgColor="transparent" fgColor="hsl(var(--foreground))" />
            <div className="w-full relative z-10">
              <p 
                onClick={handleCopyUrl}
                className="text-xs text-muted-foreground break-all text-center font-mono bg-muted p-2 rounded w-full cursor-pointer hover:bg-muted/80 transition-colors"
                title={t('clickToCopy')}
              >
                {sendUrl}
              </p>
              {urlCopyStatus && (
                <p className="text-[10px] text-green-500 text-center mt-1 absolute w-full -bottom-5">{urlCopyStatus}</p>
              )}
            </div>
          </div>
        )}

        {receivedText && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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
