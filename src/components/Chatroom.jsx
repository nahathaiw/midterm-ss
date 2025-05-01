import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { getDocs } from 'firebase/firestore';
import '../App.css';

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

export default function Chatroom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // to send img url
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const [gifResults, setGifResults] = useState([]);

  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [allowed, setAllowed] = useState(false);
  const [chatroomData, setChatroomData] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const bottomRef = useRef(null);
  const profilesCache = useRef({});

  const user = auth.currentUser;

  // add the notification
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            console.log("Notification permission status:", permission);
        }
      });
    }
  }, []);
  
  
  // Check access
  useEffect(() => {
    const checkAccess = async () => {
        if (!roomId || !user) return;
      
        const roomRef = doc(db, 'chatrooms', roomId);
        const snap = await getDoc(roomRef);
        if (!snap.exists()) {
          alert("❌ Chatroom does not exist.");
          return navigate('/chatroom');
        }
      
        const data = snap.data();
        setChatroomData(data);
      
        if (data.members?.includes(user.email)) {
          setAllowed(true);
      
          // ✅ Check if the latest message was already a "user joined" system message
          const msgQuery = query(
            collection(db, `chatrooms/${roomId}/messages`),
            orderBy('createdAt', 'desc'),
            // Only check the last 5 messages just to be safe
          );
          const latestSnap = await getDocs(msgQuery);
          const alreadyAnnounced = latestSnap.docs.slice(0, 5).some(doc => {
            const m = doc.data();
            return m.uid === 'system' && m.text === `${user.email} joined the room.`;
          });
      
          if (!alreadyAnnounced) {
            await addDoc(collection(db, `chatrooms/${roomId}/messages`), {
              text: `${user.email} joined the room.`,
              uid: 'system',
              user: 'system',
              createdAt: serverTimestamp()
            });
          }
      
        } else {
          alert("🚫 You are not a member of this chatroom.");
          navigate('/chatroom');
        }
      };
      
      

    checkAccess();
  }, [roomId, user, navigate]);

  // Load messages + profiles
  useEffect(() => {
    if (!roomId || !allowed) return;

    const q = query(
      collection(db, `chatrooms/${roomId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newMessages = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const senderUid = data.uid;

        if (!profilesCache.current[senderUid]) {
          const profileSnap = await getDoc(doc(db, 'profiles', senderUid));
          if (profileSnap.exists()) {
            profilesCache.current[senderUid] = profileSnap.data();
          }
        }

        newMessages.push({
          id: docSnap.id,
          ...data,
          profile: profilesCache.current[senderUid]
        });

        if (
            data.uid !== user?.uid &&
            Notification.permission === "granted"
          
          ) {
            new Notification(`New message from ${profilesCache.current[senderUid]?.name || data.user}`, {
              body: data.text || 'Sent a message',
              icon: profilesCache.current[senderUid]?.photoURL || '/chat-icon.png'
            });
          }
          
      }

      setMessages(newMessages);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => unsubscribe();
  }, [roomId, allowed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Typing indicator
  useEffect(() => {
    if (!roomId || !allowed) return;
    const q = collection(db, `chatrooms/${roomId}/typing`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data().user);
      setTypingUsers(users.filter(email => email !== user?.email));
    });
    return () => unsubscribe();
  }, [roomId, allowed, user?.email]);

  // Send message
  const handleSend = async () => {
    const text = message.trim();
    const user = auth.currentUser;
    if (!text || !user || !user.email || !user.uid) return;

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          name: user.displayName || 'Anonymous',
          email: user.email,
          photoURL: user.photoURL || 'https://i.pravatar.cc/150?u=default'
        });
      }

      await addDoc(collection(db, `chatrooms/${roomId}/messages`), {
        text,
        user: user.email,
        uid: user.uid,
        createdAt: serverTimestamp()
      });

      setMessage('');
      clearTyping();
    } catch (error) {
      alert("❌ Failed to send message: " + error.message);
    }
  };

  const handleSendImage = async () => {
    const url = imageUrl.trim();
    if (!url || !user?.email || !user?.uid) return;
  
    try {
      await addDoc(collection(db, `chatrooms/${roomId}/messages`), {
        imageUrl: url,
        user: user.email,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setImageUrl('');
    } catch (error) {
      alert("❌ Failed to send image: " + error.message);
    }
  };
  const fetchGifs = async () => {
    if (!gifSearchTerm) return;
    try {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=4zAnusMW1meje47uPJOKJUU6dmQuY9xq&q=${encodeURIComponent(gifSearchTerm)}&limit=10&rating=pg`
      );
      const data = await res.json();
      setGifResults(data.data);
    } catch (err) {
      console.error('Failed to fetch GIFs:', err);
    }
  };
  
  const handleSendGif = async (gifUrl) => {
    if (!gifUrl || !user?.email || !user?.uid) return;
    try {
      await addDoc(collection(db, `chatrooms/${roomId}/messages`), {
        imageUrl: gifUrl,
        user: user.email,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setGifResults([]);
      setGifSearchTerm('');
    } catch (err) {
      alert("❌ Failed to send GIF: " + err.message);
    }
  };
  


  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleTyping = async () => {
    if (!user) return;
    const typingRef = doc(db, `chatrooms/${roomId}/typing`, user.uid);
    await setDoc(typingRef, {
      user: user.email,
      timestamp: serverTimestamp()
    });
  };

  const clearTyping = async () => {
    if (!user) return;
    const typingRef = doc(db, `chatrooms/${roomId}/typing`, user.uid);
    await deleteDoc(typingRef);
  };

  const handleBackToLobby = () => navigate('/chatroom');
  const handleLogout = () => auth.signOut().then(() => navigate('/'));

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !chatroomData) return;

    const roomRef = doc(db, 'chatrooms', roomId);
    const updatedMembers = Array.from(new Set([...(chatroomData.members || []), email]));

    try {
      await setDoc(roomRef, { members: updatedMembers }, { merge: true });
      setChatroomData(prev => ({ ...prev, members: updatedMembers }));
      setInviteEmail('');
      alert(`✅ Invited ${email}`);
      await addDoc(collection(db, `chatrooms/${roomId}/messages`), {
        text: `${email} was invited to the room.`,
        uid: 'system',
        user: 'system',
        createdAt: serverTimestamp()
      });
      
    } catch (err) {
      alert("❌ Failed to invite: " + err.message);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !user || !chatroomData) return;
    const updatedMembers = chatroomData.members.filter(email => email !== user.email);
    try {
      await setDoc(doc(db, 'chatrooms', roomId), { members: updatedMembers }, { merge: true });
      alert("You left the room.");
      await addDoc(collection(db, `chatrooms/${roomId}/messages`), {
        text: `${user.email} left the room.`,
        uid: 'system',
        user: 'system',
        createdAt: serverTimestamp()
      });
      
      navigate('/chatroom');
    } catch (err) {
      alert("❌ Failed to leave: " + err.message);
    }
  };

  // 🗑️ Unsend (soft-delete) message
  const handleDeleteMessage = async (messageId) => {
    const confirmDelete = window.confirm("Do you want to unsend this message?");
    if (!confirmDelete) return;
    try {
      const ref = doc(db, `chatrooms/${roomId}/messages`, messageId);
      await updateDoc(ref, {
        deleted: true,
        text: ''
      });
    } catch (err) {
      alert("❌ Failed to unsend message: " + err.message);
    }
  };

  if (!allowed) return null;

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleBackToLobby}>← Lobby</button>
          <h2 style={{ margin: 0 }}>
            Chatroom: {chatroomData?.name || roomId}
          </h2>
        </div>
        <div>
          <button onClick={() => navigate('/profile', { state: { from: `/chatroom/${roomId}` } })} style={{ marginRight: 10 }}>
            View Profile
          </button>
          <button onClick={handleLeaveRoom} style={{ marginRight: 10 }}>Leave Room</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Creator invite */}
      {chatroomData?.members?.[0] === user?.email && (
        <div style={{ margin: '20px 0' }}>
          <h4>Invite member</h4>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="email"
              placeholder="Email to invite"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ flex: 1, padding: 8 }}
            />
            <button onClick={handleInvite}>Invite</button>
          </div>
        </div>
      )}

      {/* Members */}
      <div style={{ marginBottom: 10, fontSize: '0.9rem', color: '#444' }}>
        <strong>Members:</strong> {chatroomData?.members?.join(', ')}
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: 8, width: '100%' }}
        />
    </div>

      {/* Messages */}
      <div style={{ border: '1px solid #ccc', padding: 10, height: 300, overflowY: 'scroll', margin: '10px 0' }}>
        {messages.length === 0 ? (
          <p>No messages yet. Say hi!</p>
        ) : (
            messages
            .filter(
              msg =>
                msg.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.imageUrl
            )
            .map(msg => {
          
                      const time = msg.createdAt?.toDate
              ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';
            const isMe = msg.uid === user?.uid;
            const isSystem = msg.uid === 'system';
            const profile = msg.profile || {};
            return (
            <div
            key={msg.id}
            className="fade-in"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 10,
              position: 'relative',
              background: isSystem ? '#f5f5f5' : 'transparent',
              padding: isSystem ? 10 : 0,
              borderRadius: isSystem ? 8 : 0,
              color: isSystem ? '#333' : 'inherit',
              fontStyle: isSystem ? 'italic' : 'normal'
            }}
          >
                {!isSystem && (
                <img
                    src={profile.photoURL || 'https://i.pravatar.cc/150?u=default'}
                    alt="Profile"
                    style={{ width: 32, height: 32, borderRadius: '50%' }}
                />
                )}

                <div>
                {!isSystem && (
                    <div style={{ fontWeight: 'bold' }}>
                    {profile.name || msg.user} {isMe ? '(You)' : ''}
                    </div>
                )}
                <div>
                    {msg.deleted ? '🗑️ This message was unsent.' : msg.text}
                </div>
                {msg.imageUrl && (
                    <img
                    src={msg.imageUrl}
                    alt="sent"
                    style={{ maxWidth: '200px', marginTop: 5, borderRadius: 8 }}
                    />
                )}
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{time}</div>
                </div>

                {!isSystem && isMe && !msg.deleted && (
                <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    style={{
                    background: 'none',
                    border: 'none',
                    color: 'red',
                    cursor: 'pointer',
                    position: 'absolute',
                    right: 0
                    }}
                    title="Unsend"
                >
                    🗑️
                </button>
                )}
            </div>
            );

          })
        )}
        {typingUsers.length > 0 && (
          <p style={{ fontStyle: 'italic', color: '#555' }}>
            {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
          </p>
        )}
        <div ref={bottomRef}/>

      </div>

      {/* Input */}
      <div>
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onBlur={clearTyping}
          onKeyDown={(e) => {
            handleKeyDown(e);
            handleTyping();
          }}
          placeholder="Type a message"
          style={{ padding: 8, width: '80%', marginRight: 10 }}
        />
        <button onClick={handleSend}>Send</button>
      </div>
      <div style={{ marginTop: 10 }}>
        <input
            type="text"
            placeholder="Paste image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ width: '80%', padding: 8, marginRight: 10 }}
        />
        <button onClick={handleSendImage}>Send Image</button>
       </div>
       <div style={{ marginTop: 20 }}>
  <input
    type="text"
    placeholder="Search GIFs"
    value={gifSearchTerm}
    onChange={(e) => setGifSearchTerm(e.target.value)}
    style={{ width: '60%', padding: 8, marginRight: 10 }}
  />
  <button onClick={fetchGifs}>Search GIFs</button>
</div>

{gifResults.length > 0 && (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
    {gifResults.map((gif) => (
      <img
        key={gif.id}
        src={gif.images.fixed_height_small.url}
        alt={gif.title}
        style={{ cursor: 'pointer', borderRadius: 8 }}
        onClick={() => handleSendGif(gif.images.original.url)}
      />
    ))}
  </div>
)}


    </div>

  );
}
