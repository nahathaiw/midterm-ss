import React, { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa'; //  for the icon + logo bby
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function ChatroomPage() {
  const [chatroomName, setChatroomName] = useState('');
  const [chatroomPassword, setChatroomPassword] = useState('');
  const [myRooms, setMyRooms] = useState([]);
  const [otherRooms, setOtherRooms] = useState([]);
  const navigate = useNavigate();

  const currentEmail = auth.currentUser?.email;

  // 🔒 Redirect if not logged in
  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/');
    }
  },  [navigate]);

  // 🔁 Load and separate chatrooms
  useEffect(() => {
    const q = query(collection(db, "chatrooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const mine = allRooms.filter(room =>
        room.members?.includes(currentEmail)
      );
      const others = allRooms.filter(room =>
        !room.members?.includes(currentEmail)
      );

      setMyRooms(mine);
      setOtherRooms(others);
    });

    return () => unsubscribe();
  }, [currentEmail]);

  // ➕ Create new chatroom
  const handleCreate = async () => {
    const name = chatroomName.trim();
    const password = chatroomPassword.trim();
    if (!name || !password) return;

    try {
      const existing = await getDocs(
        query(collection(db, "chatrooms"), where("name", "==", name))
      );

      if (!existing.empty) {
        alert("Chatroom with this name already exists.");
        return;
      }

      await addDoc(collection(db, "chatrooms"), {
        name,
        password,
        createdAt: new Date(),
        members: [currentEmail]
      });

      setChatroomName('');
      setChatroomPassword('');
    } catch (error) {
      alert("Error creating chatroom: " + error.message);
    }
  };

  // 🔐 Join room with password
  const joinChatroom = async (room) => {
    const password = prompt(`Enter password for "${room.name}":`);
    if (!password) return;

    const roomRef = doc(db, "chatrooms", room.id);
    const snap = await getDoc(roomRef);
    const data = snap.data();

    if (data.password === password) {
      await updateDoc(roomRef, {
        members: arrayUnion(currentEmail)
      });
      alert(`✅ Joined ${room.name}`);
    } else {
      alert("❌ Incorrect password.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreate();
  };

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/'));
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      {/* Header */}
      <div className="chat-header">
        <div className="logo-text">
          <FaComments className="logo-icon" />
          Yappin
        </div>
        <div className="chat-header-actions">
          <button onClick={() => navigate('/profile', { state: { from: '/chatroom' } })}>
            View Profile
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>


      {/* Form */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={chatroomName}
          onChange={(e) => setChatroomName(e.target.value)}
          placeholder="Chatroom name"
          style={{ flex: 1, padding: 8 }}
        />
        <input
          value={chatroomPassword}
          onChange={(e) => setChatroomPassword(e.target.value)}
          placeholder="Password"
          type="password"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={handleCreate}>Create</button>
      </div>

      {/* My Rooms */}
      <h3>✅ My Rooms</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {myRooms.map(room => (
          <li key={room.id} style={{ marginBottom: 10 }}>
            <button
              onClick={() => navigate(`/chatroom/${room.id}`)}
              style={{
                width: '100%',
                padding: 10,
                textAlign: 'left',
                border: '1px solid #ccc',
                borderRadius: 5,
                background: '#e0ffe0'
              }}
            >
              {room.name}
            </button>
          </li>
        ))}
      </ul>

      {/* Joinable Rooms */}
      <h3>🔓 Other Rooms</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {otherRooms.map(room => (
          <li key={room.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{room.name}</span>
              <button onClick={() => joinChatroom(room)}>Join</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
