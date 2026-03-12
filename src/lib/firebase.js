import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDT4eQ6ja7kAYAOAKrUeFBA9LGnl1R-PtM",
  authDomain: "thats-so-budget.firebaseapp.com",
  projectId: "thats-so-budget",
  storageBucket: "thats-so-budget.firebasestorage.app",
  messagingSenderId: "472096434733",
  appId: "1:472096434733:web:a95db140df13be2c5c66a4"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Auth helpers
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback)
}
