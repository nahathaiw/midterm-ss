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

  console.log("🧩 roomId:", roomId);

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
      <h2>Chatroom: {roomId}</h2>

      <div
        style={{
          border: '1px solid #ccc',
          padding: 10,
          height: 300,
          overflowY: 'scroll',
          marginBottom: 10
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
