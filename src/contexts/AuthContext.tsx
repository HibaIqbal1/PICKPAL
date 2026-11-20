import React, { createContext, useContext, useEffect, useState } from "react";
import {
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  ConfirmationResult,
} from "firebase/auth";
import { auth, RecaptchaVerifier } from "../lib/firebase";
import { PickPalUser, UserRole } from "../types";
import { FirebaseService } from "../services/firebase.service";
import { AuthService, WorkerRegistrationPayload } from "../services/auth.service";
import { OtpService } from "../services/otp.service";

interface AuthCtx {
  firebaseUser: FirebaseUser | null;
  profile: PickPalUser | null;
  isAdmin: boolean;
  isWorker: boolean;
  isCustomer: boolean;
  isManager: boolean;
  isPendingApproval: boolean;
  loading: boolean;
  sendPhoneOtp: (phone: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  confirmPhoneOtpAndLogin: (confirmationResult: ConfirmationResult, otpCode: string, extraData?: Partial<PickPalUser>) => Promise<PickPalUser>;
  signupCustomerWithEmail: (name: string, phone: string, email: string, password: string, location?: string) => Promise<PickPalUser>;
  signupWorkerWithEmail: (payload: WorkerRegistrationPayload) => Promise<PickPalUser>;
  loginWithEmail: (email: string, password: string) => Promise<PickPalUser | null>;
  loginWithGoogle: (role?: UserRole) => Promise<PickPalUser>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<PickPalUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Subscribe to user Firestore profile in real-time
      const unsubProfile = FirebaseService.subscribeDoc<PickPalUser>("users", fbUser.uid, async (data) => {
        if (!data) {
          // If Firestore user doc doesn't exist yet, ensure document is created
          const ens = await AuthService.ensureUserDocument(fbUser);
          setProfile(ens);
        } else {
          setProfile(data);
        }
        setLoading(false);
      });

      const adminSnap = await FirebaseService.getDocument("admins", fbUser.uid);
      setIsAdmin(!!adminSnap);

      return () => unsubProfile();
    });

    return () => unsub();
  }, []);

  const sendPhoneOtp = async (phone: string, verifier: RecaptchaVerifier) => {
    return OtpService.sendPhoneOtp(phone, verifier);
  };

  const confirmPhoneOtpAndLogin = async (
    confirmationResult: ConfirmationResult,
    otpCode: string,
    extraData: Partial<PickPalUser> = {}
  ) => {
    return AuthService.confirmPhoneOtpAndLogin(confirmationResult, otpCode, extraData);
  };

  const signupCustomerWithEmail = async (
    name: string,
    phone: string,
    email: string,
    password: string,
    location?: string
  ) => {
    return AuthService.registerCustomerWithEmail(name, phone, email, password, location);
  };

  const signupWorkerWithEmail = async (payload: WorkerRegistrationPayload) => {
    return AuthService.registerWorkerWithEmail(payload);
  };

  const loginWithEmail = async (email: string, password: string) => {
    return AuthService.loginWithEmail(email, password);
  };

  const loginWithGoogle = async (role: UserRole = "customer") => {
    return AuthService.loginWithGoogle(role);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await AuthService.logout();
  };

  const isWorker = profile?.role === "worker";
  const isCustomer = profile?.role === "customer";
  const isManager = profile?.role === "localManager" || profile?.role === "regionalManager" || profile?.role === "manager";
  const isPendingApproval = profile?.status === "pendingApproval";

  return (
    <Ctx.Provider
      value={{
        firebaseUser,
        profile,
        isAdmin: isAdmin || profile?.role === "admin" || profile?.role === "superAdmin",
        isWorker,
        isCustomer,
        isManager,
        isPendingApproval,
        loading,
        sendPhoneOtp,
        confirmPhoneOtpAndLogin,
        signupCustomerWithEmail,
        signupWorkerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        resetPassword,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
