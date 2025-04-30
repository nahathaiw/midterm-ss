import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import ChatroomPage from './components/ChatroomPage';
import Chatroom from './components/Chatroom'; // 👈 Add this import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/chatroom" element={<ChatroomPage />} />
        <Route path="/chatroom/:roomId" element={<Chatroom />} /> {/* 👈 Add this route */}
      </Routes>
    </Router>
  );
}

export default App;
