import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDoo2C5kLt5UuWnrdkV8wJob0d3OYvcqJI",
  authDomain: "hospital-management-syst-af14c.firebaseapp.com",
  projectId: "hospital-management-syst-af14c",
  storageBucket: "hospital-management-syst-af14c.appspot.com",
  messagingSenderId: "955770223514",
  appId: "1:955770223514:web:1d32997a4c40a6ba2b1823",
  measurementId: "G-9JRG8RWG2N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);