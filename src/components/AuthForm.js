import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

  // Log debug info
  console.log("✅ Chatroom.js is rendering!");
  console.log("🧩 roomId:", roomId);

  // Listen for new messages in Firestore
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
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Auto-scroll to bottom when new message comes in
  useEffect(() => {
    const chatbox = document.getElementById('chatbox');
    if (chatbox) chatbox.scrollTop = chatbox.scrollHeight;
  }, [messages]);

  // Handle sending a message
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
    } catch (error) {
      alert("❌ Failed to send message: " + error.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chatroom: {roomId}</h2>

      <div
        id="chatbox"
        style={{
          border: '1px solid #ccc',
          padding: 10,
          height: 300,
          overflowY: 'scroll',
          marginBottom: 10,
          background: '#fff'
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet. Say hi!</p>
        ) : (
          messages.map(msg => {
            const isCurrentUser = msg.user === auth.currentUser?.email;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    background: isCurrentUser ? '#dcf8c6' : '#f1f0f0',
                    color: '#333',
                    padding: '8px 12px',
                    borderRadius: '16px',
                    maxWidth: '70%',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: 4 }}>
                    {isCurrentUser ? 'You' : msg.user}
                  </div>
                  <div>{msg.text}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

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
