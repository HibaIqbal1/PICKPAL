import {
  auth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from "../lib/firebase";
import { UserCredential } from "firebase/auth";
import { FirebaseService } from "./firebase.service";
import { PickPalUser } from "../types";

export class OtpService {
  /**
   * Format any phone input into standard E.164 format (+91XXXXXXXXXX).
   */
  public static formatE164Phone(phone: string, defaultCountryCode = "+91"): string {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    if (phone.trim().startsWith("+")) {
      return `+${digits}`;
    }
    if (digits.length === 10) {
      return `${defaultCountryCode}${digits}`;
    }
    if (digits.length > 10 && digits.startsWith("91")) {
      return `+${digits}`;
    }
    return `+${digits}`;
  }

  /**
   * Check if a phone number or email is already registered in Firestore users collection.
   */
  public static async checkDuplicate(field: "phone" | "email", value: string): Promise<boolean> {
    try {
      const users = await FirebaseService.getCollection<PickPalUser>("users");
      const val = value.trim().toLowerCase();
      return users.some((u) => {
        if (field === "phone" && u.phone) {
          const uPhone = u.phone.replace(/\D/g, "");
          const targetPhone = val.replace(/\D/g, "");
          return uPhone === targetPhone && targetPhone.length > 5;
        }
        if (field === "email" && u.email) {
          return u.email.toLowerCase() === val;
        }
        return false;
      });
    } catch (err) {
      console.warn("Duplicate check error:", err);
      return false;
    }
  }

  /**
   * Sends phone OTP using Firebase Phone Authentication.
   */
  public static async sendPhoneOtp(
    phone: string,
    verifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> {
    const formatted = this.formatE164Phone(phone);
    if (!formatted || formatted.length < 10) {
      throw new Error("Please enter a valid Indian phone number (+91).");
    }

    try {
      console.log("[PickPal Auth Debug] Sending SMS OTP to:", formatted);
      const confirmationResult = await signInWithPhoneNumber(auth, formatted, verifier);
      return confirmationResult;
    } catch (error: any) {
      console.error("FIREBASE PHONE LOGIN ERROR (sendPhoneOtp):", error?.code, error?.message, error);
      // Clean up reCAPTCHA verifier instance if sending fails so next attempt renders cleanly
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch {}
        (window as any).recaptchaVerifier = null;
      }
      const el = document.getElementById("recaptcha-container");
      if (el) el.innerHTML = "";
      throw error;
    }
  }

  /**
   * Verifies the 6-digit OTP using Firebase ConfirmationResult.
   */
  public static async confirmPhoneOtp(
    confirmationResult: ConfirmationResult,
    otpCode: string
  ): Promise<UserCredential> {
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      throw new Error("Please enter a valid 6-digit verification code.");
    }

    try {
      console.log("[PickPal Auth Debug] STEP 1: OTP verification started");
      const userCredential = await confirmationResult.confirm(cleanCode);
      console.log("[PickPal Auth Debug] STEP 2: Firebase phone authentication succeeded, UID =", userCredential.user.uid);
      return userCredential;
    } catch (error: any) {
      console.error("FIREBASE PHONE LOGIN ERROR (confirmPhoneOtp):", error?.code, error?.message, error);
      throw error;
    }
  }
}
