import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxqt16E7Ccy82QUuGztsLmboDBHgpAGfE",
  authDomain: "house-marketing-app-7ec7f.firebaseapp.com",
  projectId: "house-marketing-app-7ec7f",
  storageBucket: "house-marketing-app-7ec7f.appspot.com",
  messagingSenderId: "562110145863",
  appId: "1:562110145863:web:8289e03ed40b93269c9862",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore();
