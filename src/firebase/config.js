// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDzjreUFhRsCH3VvLMvEiVqMt43Mr8EVKo",
    authDomain: "livebetmentor.firebaseapp.com",
    databaseURL: "https://livebetmentor-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "livebetmentor",
    storageBucket: "livebetmentor.firebasestorage.app",
    messagingSenderId: "81496278724",
    appId: "1:81496278724:web:673dee10fee77287856b91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export database functions
export { database, ref, set, get, onValue };
export default app;
