import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeUyXm8t747sUgKYIRz56LiiqSejhyZrw",
  authDomain: "maprent-e0065.firebaseapp.com",
  projectId: "maprent-e0065",
  storageBucket: "maprent-e0065.firebasestorage.app",
  messagingSenderId: "285618688646",
  appId: "1:285618688646:web:67c0aaf57e9df3320a7707",
  measurementId: "G-NCGTQ8BPQB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Analytics
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
