// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQsOCnGcqn3V4yvNXR59l8ybbno507uUk",
  authDomain: "crossrent-app.firebaseapp.com",
  projectId: "crossrent-app",
  storageBucket: "crossrent-app.firebasestorage.app",
  messagingSenderId: "132854871631",
  appId: "1:132854871631:web:2f6b078f3565626e6d5c3a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);