// ============================================================
//  firebase-config.js  —  OWNER CONFIG (git-ignored, never committed)
//
//  This file is in .gitignore and will NOT be pushed to GitHub.
//  The app loads it at runtime on your deployed site.
//
//  GEMINI KEY SECURITY:
//    Restrict your Gemini key to your domain so it can't be
//    abused even if someone inspects your deployed site:
//    1. Go to console.cloud.google.com/apis/credentials
//    2. Click your key → "Website restrictions"
//    3. Add: yourusername.github.io/*
//    4. Add: localhost/* (for local testing)
//    5. API restrictions → "Generative Language API" only
// ============================================================

const FIREBASE = {
    apiKey: "AIzaSyBWNm2d8td5moMe8ThjEiuo55m1XggtPe0",
    authDomain: "ship-checker-46ab1.firebaseapp.com",
    projectId: "ship-checker-46ab1",
    storageBucket: "ship-checker-46ab1.firebasestorage.app",
    messagingSenderId: "545444841024",
    appId: "1:545444841024:web:13f26edbc0f745933501a5"
};

const GEMINI_API_KEY = "AIzaSyA26Dnc52kPPh1M5DTDleeEpPwK3GwjW1k";
