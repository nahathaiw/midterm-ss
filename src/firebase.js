// Import required Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTXBlaRAv-HxUsdmxXuJ_DoSPMe3-MZNI",
  authDomain: "midterm-ss.firebaseapp.com",
  projectId: "midterm-ss",
  storageBucket: "midterm-ss.firebasestorage.app",
  messagingSenderId: "1075562579447",
  appId: "1:1075562579447:web:dd0652ea41a55cbd7b9af2",
  measurementId: "G-62YE0PXC2D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize services
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
