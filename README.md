# 💬 Yappin – CS2410 Software Studio Midterm Project

**Yappin** is a real-time group chat application built with **React** and **Firebase**, created for the 2025 Spring CS2410 Software Studio midterm project at National Tsing Hua University.

🟢 **Live App**: [https://midterm-ss.web.app](https://midterm-ss.web.app)

---

## 📋 Table of Contents

- [Features](#features)
- [Project Requirements Checklist](#project-requirements-checklist)
- [Local Setup Instructions](#local-setup-instructions)
- [Firebase Security Rules](#firebase-security-rules)
- [Git Version Control](#git-version-control)
- [MD5 & Submission](#md5--submission)
- [License](#license)

---

## ✅ Features

### 🔐 Authentication
- Email/Password sign-up and sign-in
- Google Sign-In via Firebase Authentication

### 💬 Chatroom
- Create private chatrooms with passwords
- Join other rooms using correct password
- Real-time message updates using Firestore
- Group chat with full message history
- System messages for join, leave, and invite events

### 📱 Responsive Web Design (RWD)
- Works across desktop, tablet, and mobile
- Scrollable layouts, sticky headers, and flex-based design

### 🧑 User Profile
- Editable fields:
  - Profile picture
  - Name
  - Email (read-only)
  - Phone number
  - Address
- Profile photo and name are shown in chat messages

### 🖼️ Media & Extras
- Send image links directly (using image url)
- Send GIFs using Giphy API
- Message search by keyword
- Typing indicator
- Unsend messages
- Chrome notification support
- can invite member to join the group

---

## 📌 Project Requirements Checklist

| Category            | Requirement                                               | Status ✅ |
|---------------------|------------------------------------------------------------|-----------|
| Membership          | Email sign-up/sign-in with Firebase                       | ✅        |
| Firebase Hosting    | Hosted on Firebase: [midterm-ss.web.app](https://midterm-ss.web.app) | ✅        |
| Database            | Authenticated Firestore read/write                        | ✅        |
| Responsive Design   | Fully responsive on all screen sizes                      | ✅        |
| Git                 | Version control with regular commits                      | ✅        |
| Private Chatroom    | Group chatrooms with join protection and history          | ✅        |
| React Framework     | Built using React and functional components               | ✅        |
| Google Login        | Google sign-in available                                  | ✅        |
| Chrome Notification | Enabled and tested via Notification API                   | ✅        |
| Animation           | Includes basic animations (fade-in)                       | ✅        |
| Bonus - Profile     | Profile page with editable fields                         | ✅        |
| Bonus - Image       | Sending image URLs                                        | ✅        |
| Bonus - GIF         | Send GIFs via Giphy API                                   | ✅        |
| Bonus - Search      | Search messages by keyword                                | ✅        |
| Bonus - Unsend      | Messages can be unsent (soft-delete)                      | ✅        |

---

## 🧰 Local Setup Instructions

> 🛑 Important: This project uses Firebase — please replace credentials in `firebase.js` with your own Firebase project configuration.

### 1. Clone the Repository

```bash
git clone https://gitlab.com/your-username/chatroom-app.git
cd chatroom-app


## 🧠 Git Version Control

Git was used consistently throughout the development process.

Sample Git commit history:
-  Regular commits with meaningful messages
-  Separate commits for each feature (e.g., notifications, RWD, send GIFs)
-  Tracked progress from initial setup to final version

- I mostly commit into the master branch then I create other branch to save my progress
🔗 GitLab repository: [https://gitlab.com/nahathai.wong/midterm-ss](https://gitlab.com/nahathai.wong/midterm-ss)

