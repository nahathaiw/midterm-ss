import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

export default function UserProfile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    photoURL: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/chatroom';

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      const ref = doc(db, 'profiles', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProfile(prev => ({ ...prev, ...snap.data() }));
      } else {
        // Initialize with email if profile doesn’t exist
        setProfile(prev => ({ ...prev, email: user.email }));
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const ref = doc(db, 'profiles', user.uid);
      await setDoc(ref, profile, { merge: true });
      alert('✅ Profile saved');
    } catch (err) {
      alert('❌ Failed to save: ' + err.message);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div style={{ maxWidth: 500, margin: 'auto', padding: 20 }}>
      <h2>User Profile</h2>

      <label>Profile Picture URL</label>
      <input
        name="photoURL"
        value={profile.photoURL}
        onChange={handleChange}
        placeholder="https://example.com/photo.jpg"
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />
      {profile.photoURL && (
        <img
          src={profile.photoURL}
          alt="Profile"
          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', marginBottom: 10 }}
        />
      )}

      <label>Name</label>
      <input
        name="name"
        value={profile.name}
        onChange={handleChange}
        placeholder="Your name"
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />

      <label>Email (read-only)</label>
      <input
        name="email"
        value={profile.email}
        disabled
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />

      <label>Phone</label>
      <input
        name="phone"
        value={profile.phone}
        onChange={handleChange}
        placeholder="Phone number"
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />

      <label>Address</label>
      <textarea
        name="address"
        value={profile.address}
        onChange={handleChange}
        placeholder="Your address"
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />

      <button onClick={handleSave} style={{ padding: 10, width: '100%', marginBottom: 10 }}>
        Save Profile
      </button>

      <button onClick={() => navigate(from)} style={{ padding: 10, width: '100%' }}>
        ← Back
      </button>
    </div>
  );
}
