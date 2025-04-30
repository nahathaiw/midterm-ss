import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export default function Chatroom() {
  const { roomId } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  console.log("🧩 roomId:", roomId);

  // Logout handler
  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/');
    });
  };

  // Back to lobby handler
  const handleBackToLobby = () => {
    navigate('/chatroom');
  };

  // Real-time message listener
  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, `chatrooms/${roomId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("📥 Fetched messages:", msgs);
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Send a new message
  const handleSend = async () => {
    const text = message.trim();
    const user = auth.currentUser;

    console.log("👤 Current user:", user);
    if (!text || !user) return;

    try {
      await addDoc(collection(db, `chatrooms/${roomId}/messages`), {
        text,
        user: user.email,
        createdAt: serverTimestamp()
      });
      setMessage('');
    } catch (error) {
      alert("❌ Failed to send message: " + error.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header with back and logout buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={handleBackToLobby} style={{ padding: '6px 12px' }}>
            ← Lobby
          </button>
          <h2 style={{ margin: 0 }}>Chatroom: {roomId}</h2>
        </div>
        <button onClick={handleLogout} style={{ padding: '6px 12px' }}>
          Logout
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          border: '1px solid #ccc',
          padding: 10,
          height: 300,
          overflowY: 'scroll',
          marginBottom: 10,
          marginTop: 10
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet. Say hi!</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: 10 }}>
              <strong>{msg.user}</strong>: {msg.text}
            </div>
          ))
        )}
      </div>

      {/* Input + Send */}
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message"
        style={{ padding: 8, width: '80%', marginRight: 10 }}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
