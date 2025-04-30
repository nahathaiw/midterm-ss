<<<<<<< HEAD
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
=======
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
>>>>>>> 484b00072d46e612f634242ee9c97eea6299da88
  );
}

export default App;
