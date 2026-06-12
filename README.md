# Cloud Attendance System

A cloud-based attendance tracking system for organizations. It helps admins manage members, mark daily attendance, view attendance percentages, and export records as CSV.

This project is designed for the Pinnacle Labs Cloud Computing internship task:

> Implement a cloud-based attendance tracking system to automate record-keeping and simplify attendance management for organizations.

## Features

- Add, edit, and remove members
- Mark Present, Absent, or Late for each date
- View attendance percentage and summary cards
- Filter attendance by date
- Export attendance records to CSV
- Works locally in demo mode
- Supports Firebase Firestore for cloud database storage
- Deployable on Firebase Hosting, Netlify, Vercel, or GitHub Pages

## Tech Stack

- HTML5
- CSS3
- JavaScript
- Firebase Firestore
- Firebase Hosting

## Project Structure

```text
cloud-attendance-system/
├── index.html
├── styles.css
├── js/
│   ├── app.js
│   └── firebase-config.js
└── README.md
```

## Run Locally

You can open `index.html` directly in a browser, but using a local server is better.

```bash
cd cloud-attendance-system
python3 -m http.server 5500
```

Open:

```text
http://localhost:5500
```

By default, the app runs in local demo mode using browser storage.

## Connect Firebase Cloud Database

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Open **Build > Firestore Database**.
4. Click **Create database**.
5. Start in test mode for internship/demo submission.
6. Open **Project settings > General**.
7. Create a Web App.
8. Copy the Firebase config object.
9. Paste your values in `js/firebase-config.js`.

Example:

```js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

When a real `projectId` is added, the app automatically uses Firestore.

## Firestore Rules For Demo

For a public internship demo, you can use these temporary rules:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /attendanceApp/{document=**} {
      allow read, write: if true;
    }
  }
}
```

For production, add Firebase Authentication and restrict writes to admin users.

## Deploy On Firebase Hosting

Install Firebase CLI:

```bash
npm install -g firebase-tools
```

Login:

```bash
firebase login
```

Initialize hosting:

```bash
firebase init hosting
```

Choose:

- Use existing Firebase project
- Public directory: `.`
- Configure as single-page app: `No`
- Do not overwrite `index.html`

Deploy:

```bash
firebase deploy
```

Firebase will give you a live URL. Use that URL in your LinkedIn demo video and GitHub README.

## GitHub Upload Process

```bash
git init
git add .
git commit -m "Add cloud attendance system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cloud-attendance-system.git
git push -u origin main
```

## Demo Video Flow

1. Show the GitHub repository.
2. Open the live hosted website.
3. Add a few members.
4. Mark attendance for today.
5. Change one member to Late or Absent.
6. Show the dashboard summary.
7. Export CSV.
8. Mention that data is stored in Firebase Firestore.

## Portfolio Description

Cloud Attendance System is a web-based attendance management application built with JavaScript and Firebase. It automates daily attendance record-keeping, calculates attendance statistics, stores records in a cloud database, and supports CSV export for reporting.

