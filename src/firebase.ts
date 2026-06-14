import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "elegant-polymer-q3n78",
  appId: "1:623105388574:web:5a2a727bbc101c5d247e0f",
  apiKey: "AIzaSyCEeT0b0qBXjumWuFfNyWURh_J6iPzzo6w",
  authDomain: "elegant-polymer-q3n78.firebaseapp.com",
  storageBucket: "elegant-polymer-q3n78.firebasestorage.app",
  messagingSenderId: "623105388574"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-fc370229-286f-4d78-b15a-7bab5c952827");

const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (e) {
        console.error("Sign in failed", e);
    }
};

export const logOut = async () => {
    try {
        await signOut(auth);
    } catch (e) {
        console.error("Sign out failed", e);
    }
};
