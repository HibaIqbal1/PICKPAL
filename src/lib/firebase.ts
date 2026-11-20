/**
 * Firebase Initialization, Authentication, Firestore & Storage.
 * Uses Firebase SDK as the single source of truth for identity and data.
 */
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

// Configure local session persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Firebase persistence error:", err);
});

// Identity Providers
export const googleProvider = new GoogleAuthProvider();

export {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
};
export type { ConfirmationResult };

/**
 * Initializes Firebase RecaptchaVerifier for Phone Authentication.
 * Completely replaces the container DOM element to prevent "reCAPTCHA has already been rendered" errors.
 */
export function createRecaptchaVerifier(containerId = "recaptcha-container"): RecaptchaVerifier {
  // Clear any pre-existing verifier instance
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch { }
    (window as any).recaptchaVerifier = null;
  }

  // Remove existing container element from DOM completely and replace with a fresh node
  const oldEl = document.getElementById(containerId);
  if (oldEl && oldEl.parentNode) {
    oldEl.parentNode.removeChild(oldEl);
  }

  const freshEl = document.createElement("div");
  freshEl.id = containerId;
  freshEl.style.display = "none";
  document.body.appendChild(freshEl);

  const verifier = new RecaptchaVerifier(auth, freshEl, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved — allow signInWithPhoneNumber
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired. User needs to resend OTP.");
    },
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
}
