import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
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
  getDoc
} from 'firebase/firestore';

export default function Chatroom() {
  const { roomId } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [allowed, setAllowed] = useState(false);
  const [chatroomData, setChatroomData] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const navigate = useNavigate();

  // 🔐 Check access and load chatroom metadata
  useEffect(() => {
    const checkAccess = async () => {
      if (!roomId || !auth.currentUser) return;

      const roomRef = doc(db, 'chatrooms', roomId);
      const snap = await getDoc(roomRef);

      if (snap.exists()) {
        const data = snap.data();
        setChatroomData(data);

        if (data.members?.includes(auth.currentUser.email)) {
          setAllowed(true);
        } else {
          alert("🚫 You are not a member of this chatroom.");
          navigate('/chatroom');
        }
      } else {
        alert("❌ Chatroom does not exist.");
        navigate('/chatroom');
      }
    };

    checkAccess();
  }, [roomId]);

  // 🔁 Load messages
  useEffect(() => {
    if (!roomId || !allowed) return;

    const q = query(
      collection(db, `chatrooms/${roomId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [roomId, allowed]);

  // 🧠 Typing indicator
  useEffect(() => {
    if (!roomId || !allowed) return;

    const q = collection(db, `chatrooms/${roomId}/typing`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data().user);
      setTypingUsers(users.filter(email => email !== auth.currentUser?.email));
    });

    return () => unsubscribe();
  }, [roomId, allowed]);

  // ✉️ Send message
  const handleSend = async () => {
    const text = message.trim();
    const user = auth.currentUser;
    if (!text || !user) return;

    try {
      await addDoc(collection(db, `chatrooms/${roomId}/messages`), {
        text,
        user: user.email,
        createdAt: serverTimestamp()
      });
      setMessage('');
      clearTyping();
    } catch (error) {
      alert("❌ Failed to send message: " + error.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleTyping = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const typingRef = doc(db, `chatrooms/${roomId}/typing`, user.uid);
    await setDoc(typingRef, {
      user: user.email,
      timestamp: serverTimestamp()
    });
  };

  const clearTyping = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const typingRef = doc(db, `chatrooms/${roomId}/typing`, user.uid);
    await deleteDoc(typingRef);
  };

  const handleBackToLobby = () => navigate('/chatroom');
  const handleLogout = () => auth.signOut().then(() => navigate('/'));

  // ➕ Invite another member
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
    } catch (err) {
      alert("❌ Failed to invite: " + err.message);
    }
  };

  // 🚪 Leave room
  const handleLeaveRoom = async () => {
    if (!roomId || !auth.currentUser || !chatroomData) return;
    const updatedMembers = chatroomData.members.filter(email => email !== auth.currentUser.email);

    try {
      await setDoc(doc(db, 'chatrooms', roomId), { members: updatedMembers }, { merge: true });
      alert("You left the room.");
      navigate('/chatroom');
    } catch (err) {
      alert("❌ Failed to leave: " + err.message);
    }
  };

  // 🧱 Block render if not authorized
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
        <button
            onClick={() => navigate('/profile', { state: { from: `/chatroom/${roomId}` } })}
            style={{ marginRight: 10 }}>                
            View Profile
            </button>
            <button onClick={handleLeaveRoom} style={{ marginRight: 10 }}>
                Leave Room
            </button>
            <button onClick={handleLogout}>Logout</button>
            </div>

      </div>

      {/* Invite only if creator */}
      {chatroomData?.members?.[0] === auth.currentUser?.email && (
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

      {/* Members list */}
      <div style={{ marginBottom: 10, fontSize: '0.9rem', color: '#444' }}>
        <strong>Members:</strong> {chatroomData?.members?.join(', ')}
      </div>

      {/* Messages */}
      <div
        style={{
          border: '1px solid #ccc',
          padding: 10,
          height: 300,
          overflowY: 'scroll',
          margin: '10px 0'
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet. Say hi!</p>
        ) : (
          messages.map(msg => {
            const time = msg.createdAt?.toDate
              ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';
            return (
              <div key={msg.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 'bold' }}>{msg.user}</div>
                <div>{msg.text}</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{time}</div>
              </div>
            );
          })
        )}
        {typingUsers.length > 0 && (
          <p style={{ fontStyle: 'italic', color: '#555' }}>
            {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
          </p>
        )}
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
    </div>
  );
}
