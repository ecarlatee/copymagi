const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const xss = require('xss');
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

const fs = require('fs');
const path = require('path');

// Simple JSON DB for Chat
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Load data
let users = [];
let messages = [];
let groups = [];
let announcements = [];

try {
  if (fs.existsSync(USERS_FILE)) users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  if (fs.existsSync(MESSAGES_FILE)) messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  if (fs.existsSync(GROUPS_FILE)) groups = JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));
  if (fs.existsSync(ANNOUNCEMENTS_FILE)) announcements = JSON.parse(fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf8'));
} catch (e) {
  console.error("Error loading DB", e);
}

function saveData() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2));
  fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(announcements, null, 2));
}

// Helper to generate 4 digit tag
function generateTag() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

app.prepare().then(() => {
  const server = express();

  // Security Middleware
  server.use(helmet({
    contentSecurityPolicy: false, // Disabled for dev/socket.io compatibility, enable in prod with strict config
  }));
  
  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  server.use(limiter);

  // Serve uploaded files securely
  server.get('/api/chat/file/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    // Basic path traversal protection
    if (fileId.includes('..') || fileId.includes('/')) {
      return res.status(400).send('Invalid file ID');
    }
    
    const filePath = path.join(UPLOADS_DIR, fileId);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

  // Next.js handler
  server.all(/(.*)/, (req, res) => {
    return handle(req, res);
  });

  const httpServer = createServer(server);

  const io = new Server(httpServer, {
    maxHttpBufferSize: 1e8, // 100 MB
    cors: {
      origin: dev ? "http://localhost:3000" : "https://yourdomain.com", // Restrict origin
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);

    // --- Chat Events ---
    socket.on('create-account', async ({ username, mnemonic, customTag }) => {
      // Sanitize username
      const cleanUsername = xss(username);
      
      // Check if user exists (need to check hash for all users? No, mnemonic is key)
      // Since we are hashing, we can't just find(u => u.mnemonic === mnemonic) directly if we only stored hashes.
      // BUT, for this app, the mnemonic IS the login credential.
      // To verify "if user exists", we'd need to check if the HASH of the provided mnemonic matches any stored hash.
      
      let existing = null;
      for (const u of users) {
        if (bcrypt.compareSync(mnemonic, u.mnemonicHash)) {
          existing = u;
          break;
        }
      }

      if (existing) {
        const { mnemonicHash: _, ...safeUser } = existing;
        socket.emit('login-success', safeUser);
        return;
      }

      // Create new user
      let tag = customTag;
      if (!tag || !/^\d{4}$/.test(tag)) {
        tag = generateTag();
      }

      // Ensure username#tag is unique
      const collision = users.find(u => u.username === cleanUsername && u.tag === tag);
      if (collision) {
        if (customTag) {
          socket.emit('login-failed', 'This Username#Tag combination is already taken.');
          return;
        } else {
          // Retry generation once if random collision
          tag = generateTag();
          if (users.find(u => u.username === cleanUsername && u.tag === tag)) {
             socket.emit('login-failed', 'Username is too popular, please try again.');
             return;
          }
        }
      }
      
      // Hash the mnemonic
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(mnemonic, salt);

      // Determine role: First user is 'creator', others 'user'
      const role = users.length === 0 ? 'creator' : 'user';

      const newUser = {
        id: require('crypto').randomUUID(),
        username: cleanUsername,
        tag,
        role,
        mnemonicHash: hash, // Store HASH, not plain text
        createdAt: Date.now(),
        friends: [], // List of user IDs
        avatar: null,
        bio: '',
        banner: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
        settings: {
          fontSize: 'medium', // small, medium, large
          themeColor: 'default'
        }
      };
      
      users.push(newUser);
      saveData();
      
      const { mnemonicHash: _, ...safeNewUser } = newUser;
      socket.emit('account-created', safeNewUser);
    });

    socket.on('login', ({ mnemonic }) => {
      // Find user by comparing hash
      let user = null;
      for (const u of users) {
        // Handle legacy plain text users if any (optional migration)
        if (u.mnemonic && u.mnemonic === mnemonic) {
           user = u;
           // Migrate to hash?
           const salt = bcrypt.genSaltSync(10);
           u.mnemonicHash = bcrypt.hashSync(mnemonic, salt);
           delete u.mnemonic;
           saveData();
           break;
        }
        // Check hash
        if (u.mnemonicHash && bcrypt.compareSync(mnemonic, u.mnemonicHash)) {
          user = u;
          break;
        }
      }

      if (user) {
        // Migration: Assign default role if missing
        if (!user.role) {
           // If this is the first user in the list, make them creator (simple heuristic)
           // Or if they are the only user.
           if (users.indexOf(user) === 0) {
             user.role = 'creator';
           } else {
             user.role = 'user';
           }
           saveData();
        }

        const { mnemonicHash: _, mnemonic: __, ...safeUser } = user;
        socket.emit('login-success', safeUser);
      } else {
        socket.emit('login-failed', 'Invalid key. Account not found.');
      }
    });

    socket.on('update-profile', ({ userId, profileData }) => {
      const user = users.find(u => u.id === userId);
      if (user) {
        if (profileData.bio !== undefined) user.bio = xss(profileData.bio);
        if (profileData.avatarPosition !== undefined) user.avatarPosition = profileData.avatarPosition;
        if (profileData.bannerPosition !== undefined) user.bannerPosition = profileData.bannerPosition;
        
        // Handle Avatar Upload
        if (profileData.avatarFile) {
           const fileId = require('crypto').randomUUID();
           const ext = profileData.avatarType?.split('/')[1] || 'png';
           const fileName = `avatar-${userId}-${fileId}.${ext}`;
           fs.writeFileSync(path.join(UPLOADS_DIR, fileName), profileData.avatarFile);
           user.avatar = `/api/chat/file/${fileName}`;
        }

        // Handle Banner Upload
        if (profileData.bannerFile) {
           // Check if GIF - Reject
           if (profileData.bannerType === 'image/gif') {
             // Do nothing or emit error? For now silently ignore as per "pas de gifs"
           } else {
             const fileId = require('crypto').randomUUID();
             const ext = profileData.bannerType?.split('/')[1] || 'png';
             const fileName = `banner-${userId}-${fileId}.${ext}`;
             fs.writeFileSync(path.join(UPLOADS_DIR, fileName), profileData.bannerFile);
             // Store as URL. Frontend will handle CSS
             user.banner = `/api/chat/file/${fileName}`; 
           }
        }

        saveData();
        const { mnemonicHash: _, mnemonic: __, ...safeUser } = user;
        // Broadcast update so everyone sees new profile immediately
        io.emit('profile-updated', safeUser);
      }
    });

    socket.on('update-settings', ({ userId, settings }) => {
      const user = users.find(u => u.id === userId);
      if (user) {
        user.settings = { ...user.settings, ...settings };
        saveData();
        socket.emit('settings-updated', user.settings);
      }
    });

    // --- Admin / Creator Events ---

    socket.on('admin-delete-user', ({ adminId, targetId }) => {
      const admin = users.find(u => u.id === adminId);
      const targetIndex = users.findIndex(u => u.id === targetId);
      
      if (!admin || targetIndex === -1) return;

      // Check permissions
      const isAdmin = admin.role === 'admin';
      const isCreator = admin.role === 'creator';
      const target = users[targetIndex];
      const targetIsCreator = target.role === 'creator';

      // Creator can delete anyone. Admin can delete users (not creators or other admins ideally, but let's say not creators)
      if (isCreator || (isAdmin && !targetIsCreator)) {
        // Remove user
        users.splice(targetIndex, 1);
        
        // Remove from friends lists
        users.forEach(u => {
          if (u.friends && u.friends.includes(targetId)) {
            u.friends = u.friends.filter(id => id !== targetId);
          }
        });
        
        // Remove from groups
        groups.forEach(g => {
          if (g.members.includes(targetId)) {
            g.members = g.members.filter(id => id !== targetId);
          }
        });

        saveData();
        io.emit('user-deleted', targetId); // Notify clients to remove from UI
      } else {
        socket.emit('error', 'Insufficient permissions');
      }
    });

    socket.on('admin-set-role', ({ adminId, targetId, newRole }) => {
      const admin = users.find(u => u.id === adminId);
      const target = users.find(u => u.id === targetId);
      
      if (!admin || !target) return;

      // Only Creator can promote/demote to Admin/Creator
      if (admin.role === 'creator') {
        if (['user', 'admin'].includes(newRole)) {
           target.role = newRole;
           saveData();
           // Notify target and admin
           io.emit('profile-updated', { id: target.id, role: newRole });
        }
      } else {
        socket.emit('error', 'Only Creator can change roles');
      }
    });

    socket.on('get-user-profile', (targetId) => {
      const user = users.find(u => u.id === targetId);
      if (user) {
        socket.emit('user-profile', {
          id: user.id,
          username: user.username,
          tag: user.tag,
          role: user.role || 'user', // Send role
          avatar: user.avatar,
          avatarPosition: user.avatarPosition,
          bio: user.bio,
          banner: user.banner,
          bannerPosition: user.bannerPosition,
          createdAt: user.createdAt
        });
      }
    });

    socket.on('add-friend', ({ userId, targetUsername, targetTag }) => {
      const user = users.find(u => u.id === userId);
      const target = users.find(u => u.username === targetUsername && u.tag === targetTag);

      if (!user || !target) {
        socket.emit('friend-error', 'User not found');
        return;
      }

      if (user.id === target.id) {
        socket.emit('friend-error', 'Cannot add yourself');
        return;
      }

      if (!user.friends) user.friends = [];
      if (user.friends.includes(target.id)) {
        socket.emit('friend-error', 'Already friends');
        return;
      }

      // Add friend (unidirectional for now, or bidirectional?)
      // Let's make it bidirectional for simplicity
      user.friends.push(target.id);
      if (!target.friends) target.friends = [];
      if (!target.friends.includes(user.id)) target.friends.push(user.id);
      
      saveData();

      // Notify both
      socket.emit('friend-added', { id: target.id, username: target.username, tag: target.tag });
      // If target is online, we should notify them too, but we need to track socket->userId mapping
      // For now, just update requester
    });

    socket.on('get-friends', (userId) => {
      const user = users.find(u => u.id === userId);
      if (!user || !user.friends) {
        socket.emit('friends-list', []);
        return;
      }
      
      const friendList = user.friends.map(fid => {
        const f = users.find(u => u.id === fid);
        return f ? { id: f.id, username: f.username, tag: f.tag } : null;
      }).filter(Boolean);
      
      socket.emit('friends-list', friendList);
    });

    socket.on('send-message', (msg) => {
      // msg: { senderId, receiverId, content, timestamp }
      const newMessage = {
        id: require('crypto').randomUUID(),
        ...msg,
        content: xss(msg.content), // Sanitize message content
        isSaved: false // Default not saved
      };
      messages.push(newMessage);
      saveData();

      // In a real app, emit to specific socket room for receiver
      // Here we broadcast to everyone and client filters (inefficient but simple for prototype without auth-socket mapping)
      // Better: join room `user-${userId}` on login
      io.emit('receive-message', newMessage); 
    });

    socket.on('create-group', ({ name, memberIds, creatorId }) => {
      const newGroup = {
        id: require('crypto').randomUUID(),
        name: xss(name), // Sanitize group name
        members: [...memberIds, creatorId], // Ensure creator is in
        createdAt: Date.now(),
        isGroup: true
      };
      groups.push(newGroup);
      saveData();
      
      // Notify all members
      // Since we broadcast, we can just emit 'group-created' and let clients filter if they are in it
      io.emit('group-created', newGroup);
    });

    socket.on('get-groups', (userId) => {
      const userGroups = groups.filter(g => g.members.includes(userId));
      socket.emit('groups-list', userGroups);
    });

    socket.on('send-chat-file', ({ file, fileName, fileType, receiverId, senderId }) => {
      const fileId = require('crypto').randomUUID();
      fs.writeFileSync(path.join(UPLOADS_DIR, fileId), file);
      
      const msg = {
        id: require('crypto').randomUUID(),
        senderId,
        receiverId,
        type: 'file',
        content: xss(fileName), // Display name sanitized
        fileId,
        fileUrl: `/api/chat/file/${fileId}`,
        fileType,
        timestamp: Date.now(),
        isSaved: false
      };
      messages.push(msg);
      saveData();
      io.emit('receive-message', msg);
    });

    socket.on('get-messages', ({ userId, otherId }) => {
      // Filter messages between these two users OR for a group
      // Check if otherId is a group
      const isGroup = groups.find(g => g.id === otherId);
      
      const now = Date.now();
      const history = messages.filter(m => {
        let isRelevant = false;
        if (isGroup) {
           isRelevant = m.receiverId === otherId;
        } else {
           isRelevant = (m.senderId === userId && m.receiverId === otherId) || 
                        (m.senderId === otherId && m.receiverId === userId);
        }
        
        if (!isRelevant) return false;

        // Check retention
        if (m.isSaved) return true;
        
        // 48 hours = 48 * 60 * 60 * 1000 ms
        const age = now - m.timestamp;
        return age < 48 * 60 * 60 * 1000;
      }).map(m => {
        if (m.type === 'file' && m.fileId && !m.fileUrl) {
          return { ...m, fileUrl: `/api/chat/file/${m.fileId}` };
        }
        return m;
      });
      
      socket.emit('chat-history', history);
    });

    // --- Announcements ---

    socket.on('get-announcements', () => {
      socket.emit('announcements-list', announcements);
    });

    socket.on('send-announcement', ({ userId, content }) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      if (user.role === 'creator' || user.role === 'admin') {
        const newAnnouncement = {
          id: require('crypto').randomUUID(),
          senderId: user.id,
          senderName: user.username,
          senderTag: user.tag,
          role: user.role,
          content: xss(content),
          timestamp: Date.now()
        };
        announcements.push(newAnnouncement);
        saveData();
        io.emit('receive-announcement', newAnnouncement);
      } else {
        socket.emit('error', 'Insufficient permissions');
      }
    });

    // --- Existing Events ---

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
      socket.to(roomId).emit('receive-text', xss(text)); // Sanitize
    });

    socket.on('send-file', ({ roomId, file, fileName, fileType }) => {
      console.log(`File received in room ${roomId}: ${fileName}`);
      socket.to(roomId).emit('receive-file', { file, fileName: xss(fileName), fileType });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
