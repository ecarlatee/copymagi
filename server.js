const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer, {
    maxHttpBufferSize: 1e8 // 100 MB
  });

  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('send-text', ({ roomId, text }) => {
      console.log(`Text received in room ${roomId}: ${text}`);
      // Broadcast to everyone in the room except the sender (though sender doesn't need it)
      // Or use io.to(roomId) to send to everyone including sender
      socket.to(roomId).emit('receive-text', text);
    });

    socket.on('send-file', ({ roomId, file, fileName, fileType }) => {
      console.log(`File received in room ${roomId}: ${fileName}`);
      socket.to(roomId).emit('receive-file', { file, fileName, fileType });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
