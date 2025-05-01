import React, { useEffect } from 'react';

export default function NotificationTest() {
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        console.log("Permission:", permission);
      });
    }
  }, []);

  const handleSend = () => {
    if (Notification.permission === "granted") {
      new Notification("✅ It works!", {
        body: "This is a test notification.",
        icon: "https://cdn-icons-png.flaticon.com/512/1827/1827279.png"
      });
    } else {
      alert("Please allow notifications first.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🔔 Notification Test</h1>
      <button onClick={handleSend}>Send Notification</button>
    </div>
  );
}
