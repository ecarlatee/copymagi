'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/language-provider';
import { generateMnemonic } from '@/lib/mnemonic';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export default function ChatPage() {
  const { t } = useLanguage();
  const [view, setView] = useState<'welcome' | 'create-warning' | 'create-generate' | 'login' | 'chat'>('welcome');
  const [mnemonic, setMnemonic] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [customTag, setCustomTag] = useState<string>('');
  const [inputMnemonic, setInputMnemonic] = useState<string>('');
  const [user, setUser] = useState<{ 
    id: string; 
    username: string; 
    tag: string;
    role?: string;
    avatar?: string;
    bio?: string;
    banner?: string;
    settings?: { fontSize: string; themeColor: string; };
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [userCount, setUserCount] = useState<number>(0);
  const [recoverDate, setRecoverDate] = useState('');
  const [recoverTime, setRecoverTime] = useState('');
  const [recoverUsername, setRecoverUsername] = useState('');
  const [showRecover, setShowRecover] = useState(false);

  const [friends, setFriends] = useState<{id: string, username: string, tag: string}[]>([]);
  const [messages, setMessages] = useState<{
    id: string;
    senderId: string;
    content: string;
    timestamp: number;
    type?: 'text' | 'file';
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const currentChatRef = useRef<string | null>(null);

  // Profile & Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editAvatarPos, setEditAvatarPos] = useState({ x: 50, y: 50 });
  const [editBannerPos, setEditBannerPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  const [newMessage, setNewMessage] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');

  const [groups, setGroups] = useState<{id: string, name: string, members: string[]}[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<{
    id: string;
    senderId: string;
    senderName: string;
    senderTag: string;
    role: string;
    content: string;
    timestamp: number;
  }[]>([]);
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    socket = io();
    
    socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    socket.on('user-count', (count) => setUserCount(count));
    socket.on('user-count-update', (count) => setUserCount(count));
    
    socket.on('recover-alert', (msg) => alert(msg));
    socket.on('recover-failed', (msg) => setError(msg));

    socket.on('login-success', (userData) => {
      setUser(userData);
      setView('chat');
      setError('');
      socket.emit('get-friends', userData.id);
      socket.emit('get-groups', userData.id);
      socket.emit('get-announcements');
    });

    socket.on('announcements-list', (list) => {
      setAnnouncements(list);
    });

    socket.on('receive-announcement', (announcement) => {
      setAnnouncements(prev => [...prev, announcement]);
    });

    socket.on('login-failed', (msg) => {
      setError(msg);
    });

    socket.on('account-created', (userData) => {
      setUser(userData);
      setView('chat');
    });

    socket.on('user-profile', (profile) => {
      setViewingProfile(profile);
      setEditBio(profile.bio || '');
      
      const parsePos = (str: string) => {
        if (!str || str === 'center') return { x: 50, y: 50 };
        if (str === 'top') return { x: 50, y: 0 };
        if (str === 'bottom') return { x: 50, y: 100 };
        const parts = str.split(' ');
        if (parts.length === 2) return { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
        return { x: 50, y: 50 };
      };

      setEditAvatarPos(parsePos(profile.avatarPosition));
      setEditBannerPos(parsePos(profile.bannerPosition));
      setEditAvatarFile(null);
      setEditBannerFile(null);
    });

    socket.on('profile-updated', (updatedUser) => {
      if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
      }
      if (viewingProfile && viewingProfile.id === updatedUser.id) {
        setViewingProfile(updatedUser);
      }
      setIsEditingProfile(false);
    });

    socket.on('settings-updated', (newSettings) => {
      if (user) {
        setUser(prev => prev ? { ...prev, settings: newSettings } : null);
      }
    });

    socket.on('friends-list', (list) => {
      setFriends(list);
    });

    socket.on('groups-list', (list) => {
      setGroups(list);
    });

    socket.on('group-created', (group) => {
      // Only add if I am a member
      if (user && group.members.includes(user.id)) {
        setGroups(prev => [...prev, group]);
      }
      setShowCreateGroup(false);
      setGroupName('');
      setSelectedFriends([]);
    });

    socket.on('friend-added', (friend) => {
      setFriends(prev => [...prev, friend]);
      setAddFriendInput('');
    });

    socket.on('friend-error', (msg) => {
      alert(msg);
    });

    socket.on('chat-history', (history) => {
      setMessages(history);
    });

    socket.on('receive-message', (msg) => {
      const activeChat = currentChatRef.current;
      if (!activeChat) return;

      const isRelevant = 
        msg.receiverId === activeChat || 
        msg.senderId === activeChat;

      if (isRelevant) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user]);

  // Session Timeout (15 minutes)
  useEffect(() => {
    if (!user) return;

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        alert("Session timed out due to inactivity (15m). Please log in again.");
        socket.disconnect();
        setUser(null);
        setView('welcome');
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearTimeout(timeout);
    };
  }, [user]);

  const handleSendAnnouncement = () => {
    if (!announcementText.trim() || !user) return;
    socket.emit('send-announcement', { userId: user.id, content: announcementText });
    setAnnouncementText('');
  };

  const handleCreateGroup = () => {
    if (!groupName || selectedFriends.length === 0) return;
    socket.emit('create-group', { name: groupName, memberIds: selectedFriends, creatorId: user?.id });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChat || !user) return;

    // Read file
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        socket.emit('send-chat-file', {
          file: evt.target.result,
          fileName: file.name,
          fileType: file.type,
          receiverId: currentChat,
          senderId: user.id
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleViewProfile = (id: string) => {
    socket.emit('get-user-profile', id);
  };

  const handleImageDrag = (e: React.MouseEvent, currentPos: {x: number, y: number}, setPos: (p: {x: number, y: number}) => void) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = currentPos.x;
    const startPosY = currentPos.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const sensitivity = 0.5; 
      
      let newX = Math.max(0, Math.min(100, startPosX - (deltaX * sensitivity)));
      let newY = Math.max(0, Math.min(100, startPosY - (deltaY * sensitivity)));
      
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    const profileData: any = { 
      bio: editBio,
      avatarPosition: `${editAvatarPos.x}% ${editAvatarPos.y}%`,
      bannerPosition: `${editBannerPos.x}% ${editBannerPos.y}%`
    };

    if (editAvatarFile) {
      const buffer = await editAvatarFile.arrayBuffer();
      profileData.avatarFile = buffer;
      profileData.avatarType = editAvatarFile.type;
    }

    if (editBannerFile) {
      const buffer = await editBannerFile.arrayBuffer();
      profileData.bannerFile = buffer;
      profileData.bannerType = editBannerFile.type;
    }

    socket.emit('update-profile', { 
      userId: user.id, 
      profileData
    });
  };

  const handleUpdateSettings = (key: string, value: string) => {
    if (!user) return;
    socket.emit('update-settings', {
      userId: user.id,
      settings: { [key]: value }
    });
  };

  const handleAdminDelete = () => {
    if (!user || !viewingProfile) return;
    if (confirm(t('deleteConfirm', { username: viewingProfile.username }))) {
      socket.emit('admin-delete-user', { adminId: user.id, targetId: viewingProfile.id });
      setViewingProfile(null);
    }
  };

  const handleAdminPromote = (role: string) => {
    if (!user || !viewingProfile) return;
    if (confirm(t('roleConfirm', { username: viewingProfile.username, role }))) {
      socket.emit('admin-set-role', { adminId: user.id, targetId: viewingProfile.id, newRole: role });
    }
  };

  const getFontSizeClass = () => {
    const size = user?.settings?.fontSize || 'medium';
    switch(size) {
      case 'small': return 'text-xs';
      case 'large': return 'text-lg';
      default: return 'text-sm';
    }
  };

  const getThemeStyle = () => {
    const color = user?.settings?.themeColor;
    switch (color) {
      case 'blue': return { '--primary': '221.2 83.2% 53.3%' } as React.CSSProperties;
      case 'purple': return { '--primary': '262.1 83.3% 57.8%' } as React.CSSProperties;
      case 'orange': return { '--primary': '24.6 95% 53.1%' } as React.CSSProperties;
      default: return {};
    }
  };


  // ... (previous handlers)

  const handleAddFriend = () => {
    if (!addFriendInput.includes('#')) {
      alert(t('invalidFormat'));
      return;
    }
    const [fName, fTag] = addFriendInput.split('#');
    socket.emit('add-friend', { userId: user?.id, targetUsername: fName, targetTag: fTag });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentChat || !user) return;
    
    const msg = {
      senderId: user.id,
      receiverId: currentChat,
      content: newMessage,
      timestamp: Date.now()
    };
    
    socket.emit('send-message', msg);
    setMessages(prev => [...prev, { ...msg, id: 'temp-' + Date.now() }]);
    setNewMessage('');
  };

  const handleCreateStart = () => {
    setView('create-warning');
  };

  const handleWarningAccept = () => {
    try {
        const words = generateMnemonic();
        setMnemonic(words);
        setView('create-generate');
    } catch (e) {
        console.error("Error generating mnemonic", e);
        setError("Failed to generate secure key. Please try again.");
    }
  };

  const handleCreateAccount = () => {
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError('Username must contain only letters and numbers');
      return;
    }
    if (customTag && !/^\d{4}$/.test(customTag)) {
      setError('Tag must be exactly 4 digits (e.g. 1234)');
      return;
    }
    
    socket.emit('create-account', { username, mnemonic, customTag });
  };

  const handleLogin = () => {
    if (!inputMnemonic) {
      setError('Please enter your 12-word key');
      return;
    }
    socket.emit('login', { mnemonic: inputMnemonic });
  };

  if (view === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-4xl font-bold">{t('secureChat')}</h1>
          <p className="text-muted-foreground">
            {t('encryptedMsg')}
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            Users Created: {userCount}
          </p>
          <div className="flex flex-col gap-4">
            <Button onClick={handleCreateStart} size="lg">{t('createAccount')}</Button>
            <Button onClick={() => setView('login')} variant="outline" size="lg">{t('loginKey')}</Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'create-warning') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="max-w-md w-full space-y-6 bg-destructive/10 p-8 rounded-xl border border-destructive">
          <h2 className="text-2xl font-bold text-destructive">⚠️ {t('importantWarning')}</h2>
          <div className="space-y-4 text-sm">
            <p>{t('warningText')}</p>
            <p className="font-bold">{new Date().toLocaleString()}</p>
          </div>
          <Button onClick={handleWarningAccept} className="w-full" variant="destructive">
            {t('understandKey')}
          </Button>
          <Button onClick={() => setView('welcome')} variant="ghost" className="w-full">
            {t('cancel')}
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'create-generate') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold">{t('secretKey')}</h2>
          <div className="bg-muted p-6 rounded-xl font-mono text-sm grid grid-cols-3 gap-2 text-center select-all">
            {mnemonic.split(' ').map((word, i) => (
              <span key={i} className="bg-background p-1 rounded border">{i+1}. {word}</span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {t('copyWords')}
          </p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('chooseUsername')}</label>
            <div className="flex gap-2">
              <Input 
                placeholder="Username" 
                value={username} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground font-bold">#</span>
                <Input 
                  placeholder="0000" 
                  value={customTag} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTag(e.target.value)}
                  className="w-20 text-center"
                  maxLength={4}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t('tagOptional')}
            </p>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>

          <Button onClick={handleCreateAccount} className="w-full">
            {t('savedKey')}
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold">{t('loginKey')}</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('enterKey')}</label>
            <textarea 
              className="w-full min-h-[100px] p-3 rounded-md border bg-background"
              placeholder="apple banana ..."
              value={inputMnemonic}
              onChange={(e) => setInputMnemonic(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
          <Button onClick={handleLogin} className="w-full">
            {t('unlockAccount')}
          </Button>
          
          <div className="pt-4 border-t">
            <Button 
              variant="link" 
              className="w-full text-xs text-muted-foreground"
              onClick={() => setShowRecover(!showRecover)}
            >
              Lost Account?
            </Button>
            
            {showRecover && (
              <div className="space-y-3 mt-2 bg-muted/50 p-4 rounded-lg animate-in slide-in-from-top-2">
                <p className="text-xs text-muted-foreground">Enter your username and the exact date/time of account creation to recover access.</p>
                <div className="space-y-1">
                  <label className="text-xs">Username (without tag)</label>
                  <Input 
                    placeholder="Username"
                    value={recoverUsername}
                    onChange={(e) => setRecoverUsername(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs">Date</label>
                    <Input 
                      type="date" 
                      value={recoverDate} 
                      onChange={(e) => setRecoverDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Time</label>
                    <Input 
                      type="time" 
                      value={recoverTime} 
                      onChange={(e) => setRecoverTime(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="w-full h-8 text-xs"
                  onClick={() => socket.emit('recover-account', { username: recoverUsername, date: recoverDate, time: recoverTime })}
                >
                  Recover Account
                </Button>
              </div>
            )}
          </div>

          <Button onClick={() => setView('welcome')} variant="ghost" className="w-full">
            {t('back')}
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'chat' && user) {
    return (
      <div 
        className={`flex h-[calc(100vh-80px)] max-w-6xl mx-auto w-full p-4 gap-4 ${getFontSizeClass()}`}
        style={getThemeStyle()}
      >
        {/* Sidebar */}
        <div className="w-1/3 bg-card border rounded-xl p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleViewProfile(user.id)}
            >
              <h2 className="font-bold text-lg">{user.username}#{user.tag}</h2>
              <p className="text-xs text-green-500">● {t('online')}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(true)}>
                ⚙️
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                socket.disconnect();
                setView('welcome');
                setUser(null);
              }}>{t('logout')}</Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Input 
              placeholder={t('addFriendPlaceholder')} 
              value={addFriendInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddFriendInput(e.target.value)}
              className="h-8 text-xs"
            />
            <Button size="sm" onClick={handleAddFriend} className="h-8">+</Button>
          </div>

          <div className="flex justify-between items-center mt-2">
             <h3 className="text-sm font-semibold text-muted-foreground">{t('friendsGroups')}</h3>
             <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setShowCreateGroup(!showCreateGroup)}>
               {showCreateGroup ? t('cancel') : '+ ' + t('createGroup')}
             </Button>
          </div>

          {showCreateGroup && (
            <div className="bg-muted p-3 rounded-lg space-y-2 animate-in slide-in-from-top-2">
              <Input 
                placeholder={t('groupName')} 
                value={groupName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroupName(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="max-h-24 overflow-y-auto space-y-1">
                {friends.map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-xs">
                    <input 
                      type="checkbox" 
                      checked={selectedFriends.includes(f.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedFriends(prev => [...prev, f.id]);
                        else setSelectedFriends(prev => prev.filter(id => id !== f.id));
                      }}
                    />
                    <span>{f.username}#{f.tag}</span>
                  </div>
                ))}
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={handleCreateGroup}>{t('create')}</Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2">
            {/* Announcements Channel */}
            <div 
              onClick={() => setCurrentChat('announcements')}
              className={`p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors flex justify-between items-center ${currentChat === 'announcements' ? 'bg-muted' : ''}`}
            >
              <p className="font-bold text-primary">📢 {t('announcements')}</p>
              {announcements.length > 0 && (
                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  {announcements.length}
                </span>
              )}
            </div>

            {/* Groups */}
            {groups.map(group => (
              <div 
                key={group.id}
                onClick={() => {
                  setCurrentChat(group.id);
                  socket.emit('get-messages', { userId: user.id, otherId: group.id });
                }}
                className={`p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors flex justify-between items-center ${currentChat === group.id ? 'bg-muted' : ''}`}
              >
                <p className="font-medium">📁 {group.name}</p>
                <span className="text-[10px] text-muted-foreground">{group.members.length} members</span>
              </div>
            ))}

            {/* Friends */}
            {friends.map(friend => (
              <div 
                key={friend.id}
                className={`p-3 rounded-lg flex justify-between items-center hover:bg-muted transition-colors ${currentChat === friend.id ? 'bg-muted' : ''}`}
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setCurrentChat(friend.id);
                    socket.emit('get-messages', { userId: user.id, otherId: friend.id });
                  }}
                >
                  <p className="font-medium">{friend.username}#{friend.tag}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProfile(friend.id);
                  }}
                >
                  👤
                </Button>
              </div>
            ))}
            {friends.length === 0 && groups.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4">{t('noFriendsGroups')}</p>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-card border rounded-xl flex flex-col overflow-hidden">
          {currentChat === 'announcements' ? (
            <>
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-bold text-primary">📢 {t('officialAnnouncements')}</h3>
                <p className="text-xs text-muted-foreground">{t('teamUpdates')}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                    <span className="text-4xl mb-2">📯</span>
                    <p>{t('noAnnouncements')}</p>
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="bg-muted/30 border rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{ann.senderName}#{ann.senderTag}</span>
                          {ann.role === 'creator' && <span className="text-[10px] bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-500/50 uppercase font-bold">{t('creator')}</span>}
                          {ann.role === 'admin' && <span className="text-[10px] bg-red-500/20 text-red-600 px-2 py-0.5 rounded-full border border-red-500/50 uppercase font-bold">{t('admin')}</span>}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{new Date(ann.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{ann.content}</p>
                    </div>
                  ))
                )}
              </div>

              {(user.role === 'creator' || user.role === 'admin') && (
                <div className="p-4 border-t bg-muted/30 flex gap-2 items-center">
                  <Input 
                    placeholder={t('postAnnouncement')} 
                    value={announcementText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnouncementText(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendAnnouncement()}
                    className="border-primary/20 focus-visible:ring-primary"
                  />
                  <Button onClick={handleSendAnnouncement}>{t('post')}</Button>
                </div>
              )}
            </>
          ) : currentChat ? (
            <>
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-bold">
                  {groups.find(g => g.id === currentChat)?.name || 
                   friends.find(f => f.id === currentChat)?.username || 'Chat'}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                        {msg.type === 'file' ? (
                          <div className="space-y-2">
                            {msg.fileType?.startsWith('image/') ? (
                              <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full rounded-lg max-h-60 object-cover" />
                            ) : (
                              <div className="flex items-center gap-2 bg-background/20 p-2 rounded">
                                <span className="text-2xl">📄</span>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-medium truncate">{msg.fileName}</p>
                                  <p className="text-[10px] opacity-70">{msg.fileSize ? (msg.fileSize / 1024).toFixed(1) + ' KB' : ''}</p>
                                </div>
                              </div>
                            )}
                            <a 
                              href={msg.fileUrl} 
                              download={msg.fileName} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline opacity-80 hover:opacity-100 block text-right"
                            >
                              {t('download')}
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                        <p className="text-[10px] opacity-70 mt-1 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t bg-muted/30 flex gap-2 items-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  📎
                </Button>
                <Input 
                  placeholder={t('typeMessage')} 
                  value={newMessage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>{t('send')}</Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              {t('selectChat')}
            </div>
          )}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-xl w-full max-w-sm space-y-4 border shadow-xl">
              <h3 className="font-bold text-lg">{t('settings')}</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fontSize')}</label>
                <div className="flex gap-2">
                  {['small', 'medium', 'large'].map(size => (
                    <Button 
                      key={size}
                      variant={user.settings?.fontSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdateSettings('fontSize', size)}
                    >
                      {t(size)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('themeColor')}</label>
                <div className="flex gap-2">
                  {['default', 'blue', 'purple', 'orange'].map(color => (
                    <div 
                      key={color}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 ${user.settings?.themeColor === color ? 'border-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: color === 'default' ? '#000' : color }}
                      onClick={() => handleUpdateSettings('themeColor', color)}
                    />
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={() => setShowSettings(false)}>{t('close')}</Button>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {viewingProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl w-full max-w-md overflow-hidden border shadow-xl relative max-h-[90vh] overflow-y-auto">
              <div className="h-32 w-full relative overflow-hidden group">
                {viewingProfile.banner && !viewingProfile.banner.startsWith('linear-gradient') ? (
                  <img 
                    src={viewingProfile.banner} 
                    alt="banner" 
                    className="w-full h-full object-cover transition-all duration-500"
                    style={{ objectPosition: viewingProfile.bannerPosition || 'center' }}
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{ background: viewingProfile.banner || 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)' }}
                  />
                )}
                {/* Gradient Overlay with Blur */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background backdrop-blur-[1px]" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent" />
              </div>
              
              <div className="px-6 pb-6 relative">
                <div className="relative -mt-12 mb-4 flex justify-between items-end">
                  <div className="w-24 h-24 rounded-full bg-background border-4 border-background flex items-center justify-center text-4xl overflow-hidden z-10 shadow-lg">
                    {viewingProfile.avatar ? (
                      <img 
                        src={viewingProfile.avatar} 
                        alt="avatar" 
                        className="w-full h-full object-cover" 
                        style={{ objectPosition: viewingProfile.avatarPosition || 'center' }}
                      />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  {user.id === viewingProfile.id && (
                    <Button size="sm" variant="outline" onClick={() => setIsEditingProfile(!isEditingProfile)}>
                      {isEditingProfile ? t('cancel') : t('editProfile')}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{viewingProfile.username}#{viewingProfile.tag}</h2>
                      {viewingProfile.role === 'creator' && <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-500/50">{t('creator')}</span>}
                      {viewingProfile.role === 'admin' && <span className="text-xs bg-red-500/20 text-red-600 px-2 py-0.5 rounded-full border border-red-500/50">{t('admin')}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{t('memberSince')} {new Date(viewingProfile.createdAt).toLocaleDateString()}</p>
                  </div>

                  {isEditingProfile ? (
                    <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{t('avatar')}</label>
                        <div className="flex gap-4 items-center">
                          <div 
                            className="w-16 h-16 rounded-full border overflow-hidden cursor-move relative group shrink-0"
                            onMouseDown={(e) => handleImageDrag(e, editAvatarPos, setEditAvatarPos)}
                          >
                            {editAvatarFile ? (
                              <img src={URL.createObjectURL(editAvatarFile)} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: `${editAvatarPos.x}% ${editAvatarPos.y}%` }} />
                            ) : viewingProfile.avatar ? (
                              <img src={viewingProfile.avatar} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: `${editAvatarPos.x}% ${editAvatarPos.y}%` }} />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">👤</div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white pointer-events-none transition-opacity">
                              {t('drag')}
                            </div>
                          </div>
                          <Input 
                            type="file"
                            accept="image/*"
                            className="h-8 text-xs flex-1"
                            onChange={(e) => setEditAvatarFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{t('banner')}</label>
                        <div className="space-y-2">
                          <div 
                            className="w-full h-24 rounded-md border overflow-hidden cursor-move relative group"
                            onMouseDown={(e) => handleImageDrag(e, editBannerPos, setEditBannerPos)}
                          >
                            {editBannerFile ? (
                              <img src={URL.createObjectURL(editBannerFile)} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: `${editBannerPos.x}% ${editBannerPos.y}%` }} />
                            ) : viewingProfile.banner && !viewingProfile.banner.startsWith('linear-gradient') ? (
                              <img src={viewingProfile.banner} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: `${editBannerPos.x}% ${editBannerPos.y}%` }} />
                            ) : (
                              <div className="w-full h-full" style={{ background: viewingProfile.banner || 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)' }} />
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white pointer-events-none transition-opacity">
                              {t('dragToReposition')}
                            </div>
                          </div>
                          <Input 
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="h-8 text-xs"
                            onChange={(e) => setEditBannerFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{t('bio')}</label>
                        <textarea 
                          className="w-full p-2 rounded border bg-background text-sm"
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          rows={3}
                          placeholder={t('bioPlaceholder')}
                        />
                      </div>
                      <Button size="sm" onClick={handleUpdateProfile} className="w-full">{t('save')}</Button>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{viewingProfile.bio || t('noBio')}</p>
                  )}
                  
                  <div className="pt-4 border-t flex gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-bold text-foreground">{viewingProfile.friends?.length || 0}</span> {t('connections')}
                    </div>
                  </div>

                  {/* Admin Controls */}
                  {(user.role === 'creator' || (user.role === 'admin' && viewingProfile.role !== 'creator')) && user.id !== viewingProfile.id && (
                    <div className="pt-4 border-t space-y-2">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground">{t('adminControls')}</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" size="sm" onClick={handleAdminDelete} className="h-7 text-xs">
                          {t('banUser')}
                        </Button>
                        {user.role === 'creator' && (
                          <>
                            {viewingProfile.role !== 'admin' && (
                              <Button variant="outline" size="sm" onClick={() => handleAdminPromote('admin')} className="h-7 text-xs">
                                {t('makeAdmin')}
                              </Button>
                            )}
                            {viewingProfile.role === 'admin' && (
                              <Button variant="outline" size="sm" onClick={() => handleAdminPromote('user')} className="h-7 text-xs">
                                {t('removeAdmin')}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-white hover:bg-black/20 z-20"
                onClick={() => setViewingProfile(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
