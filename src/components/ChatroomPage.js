import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function ChatroomPage() {
  const [chatroomName, setChatroomName] = useState('');
  const [chatrooms, setChatrooms] = useState([]);
  const navigate = useNavigate();

  // Load chatrooms in real-time
  useEffect(() => {
    const q = query(collection(db, "chatrooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatrooms(rooms);
    });

    return () => unsubscribe();
  }, []);

  // Create a new chatroom (prevent duplicates)
  const handleCreate = async () => {
    const name = chatroomName.trim();
    if (!name) return;

    try {
      const existing = await getDocs(query(collection(db, "chatrooms"), where("name", "==", name)));
      if (!existing.empty) {
        alert("Chatroom with this name already exists.");
        return;
      }

      await addDoc(collection(db, "chatrooms"), {
        name,
        createdAt: new Date()
      });

      setChatroomName('');
    } catch (error) {
      alert("Error creating chatroom: " + error.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreate();
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h2>Chatrooms</h2>

      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={chatroomName}
          onChange={(e) => setChatroomName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter new chatroom name"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={handleCreate}>Create</button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, marginTop: 20 }}>
        {chatrooms.map(room => (
          <li key={room.id} style={{ marginBottom: 10 }}>
            <button
              onClick={() => navigate(`/chatroom/${room.id}`)}
              style={{
                width: '100%',
                padding: 10,
                textAlign: 'left',
                border: '1px solid #ccc',
                borderRadius: 5,
                background: '#f9f9f9'
              }}
            >
              {room.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
