// ============================================================
//  firebase-config.example.js
//
//  COPY THIS FILE to firebase-config.js and fill in your values.
//  firebase-config.js is git-ignored and will never be committed.
//
//  STEP 1 — Firebase (free Spark plan)
//    1. Go to https://console.firebase.google.com
//    2. Create a project → Add a Web App (</>)
//    3. Copy the firebaseConfig values below
//    4. Authentication → Sign-in method → enable Email/Password + Google
//    5. Firestore Database → Create database (start in test mode)
//
//  STEP 2 — Gemini API key (completely free, no credit card)
//    1. Go to https://aistudio.google.com/app/apikey
//    2. Create API key
//    3. IMPORTANT — restrict it by HTTP referrer so it can't be abused:
//       • Open https://console.cloud.google.com/apis/credentials
//       • Click your key → "API restrictions" → restrict to "Generative Language API"
//       • "Website restrictions" → add your hosting domain (e.g. yourapp.web.app/*)
//       • Also add localhost/* for local testing
//
// ============================================================

const FIREBASE = {
    apiKey:            "YOUR_FIREBASE_API_KEY",
    authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId:             "YOUR_APP_ID",
};

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
