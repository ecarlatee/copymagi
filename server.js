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

// Store active rooms: { roomId: { ip: string, createdAt: number, location?: { lat: number, lon: number } } }
const activeRooms = new Map();

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer, {
    maxHttpBufferSize: 1e8 // 100 MB
  });

  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);

    // Get client IP
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

    socket.on('join-room', (roomId, location) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      
      // Register room if it's a new one (or update timestamp)
      // We assume the first person to join is the creator/host usually
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, { 
          ip: clientIp, 
          createdAt: Date.now(),
          location: location || null
        });
      } else if (location) {
        // Update location if provided (e.g. user allowed permission later)
        const room = activeRooms.get(roomId);
        room.location = location;
      }
    });

    socket.on('get-nearby-rooms', (clientLocation) => {
      const nearbyRooms = [];
      const now = Date.now();
      
      // Clean up old rooms (older than 24h)
      for (const [id, data] of activeRooms.entries()) {
        if (now - data.createdAt > 24 * 60 * 60 * 1000) {
          activeRooms.delete(id);
          continue;
        }
        
        let isNearby = false;

        // Check 1: Same IP (Network proximity)
        if (data.ip === clientIp) {
           isNearby = true;
        }

        // Check 2: Geolocation (Physical proximity)
        // If both have location data
        if (!isNearby && clientLocation && data.location) {
          const dist = getDistanceFromLatLonInKm(
            clientLocation.lat, clientLocation.lon,
            data.location.lat, data.location.lon
          );
          // Consider nearby if within 0.5 km (500 meters)
          if (dist <= 0.5) {
            isNearby = true;
          }
        }

        if (isNearby) {
           nearbyRooms.push(id);
        }
      }
      
      socket.emit('nearby-rooms', nearbyRooms);
    });

    socket.on('send-text', ({ roomId, text }) => {
      console.log(`Text received in room ${roomId}: ${text}`);
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
