/**
 * Firebase app initialization. Config values are your public web app config
 * (safe to ship client-side — this is not a secret, unlike a server API key).
 * Pulled from firebase-applet-config.json at the project root, which you
 * said is already connected to your real Firebase project.
 */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import config from "../firebase-applet-config.json";

export { firebaseApp, auth, db, storage, googleProvider, createRecaptchaVerifier, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider } from "./lib/firebase";
export type { ConfirmationResult } from "./lib/firebase";
