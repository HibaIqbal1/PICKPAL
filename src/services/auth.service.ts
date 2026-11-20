import { auth, googleProvider } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  User as FirebaseUser,
  ConfirmationResult,
} from "firebase/auth";
import { PickPalUser, UserRole } from "../types";
import { FirebaseService } from "./firebase.service";
import { OtpService } from "./otp.service";

export interface WorkerRegistrationPayload {
  name: string;
  phone: string;
  email: string;
  password?: string;
  address?: string;
  city?: string;
  workerType?: "home_visit" | "shop_service";
  aadhaarNumber?: string;
  panNumber?: string;
  selfie?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  skills?: string[];
  experience?: string;
  serviceCategories?: string[];
  bankDetails?: { accountNo?: string; ifsc?: string; holderName?: string };
  emergencyContact?: { name?: string; phone?: string; relation?: string };
}

export class AuthService {
  /**
   * Helper to wait until Firebase Auth state (auth.currentUser) is fully established.
   * Forces token retrieval to ensure request.auth token is ready for Firestore SDK.
   */
  public static async waitForAuthReady(targetUid?: string, timeoutMs = 5000): Promise<FirebaseUser | null> {
    if (auth.currentUser && (!targetUid || auth.currentUser.uid === targetUid)) {
      try {
        await auth.currentUser.getIdToken();
      } catch {
        // Fallthrough
      }
      return auth.currentUser;
    }
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 50));
      if (auth.currentUser && (!targetUid || auth.currentUser.uid === targetUid)) {
        try {
          await auth.currentUser.getIdToken();
        } catch {
          // Fallthrough
        }
        return auth.currentUser;
      }
    }
    return auth.currentUser;
  }

  public static async getUserProfile(uid: string): Promise<PickPalUser | null> {
    return FirebaseService.getDocument<PickPalUser>("users", uid);
  }

  public static async findUserByPhone(phone: string): Promise<PickPalUser | null> {
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const users = await FirebaseService.getCollection<PickPalUser>("users");
      const found = users.find((u) => u.phone && u.phone.replace(/\D/g, "") === cleanPhone);
      return found ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Ensures Firestore /users/{uid} document exists for authenticated Firebase User.
   * Stores ONLY defined non-sensitive user profile properties without any undefined fields.
   */
  public static async ensureUserDocument(
    fbUser: FirebaseUser,
    customData: Partial<PickPalUser> = {},
    defaultRole: UserRole = "customer"
  ): Promise<PickPalUser> {
    if (!fbUser || !fbUser.uid) {
      throw new Error("Firebase user was not returned after authentication");
    }

    await this.waitForAuthReady(fbUser.uid);

    const existing = await this.getUserProfile(fbUser.uid);
    const now = new Date().toISOString();

    if (existing) {
      // Update existing document safely without overwriting defined fields with undefined/empty values
      const updates: Partial<PickPalUser> = {
        updatedAt: now,
      };
      if (customData.name && customData.name.trim() && customData.name !== existing.name) {
        updates.name = customData.name.trim();
      }
      if (customData.phone && customData.phone.trim() && customData.phone !== existing.phone) {
        updates.phone = customData.phone.trim();
      }
      if (customData.email && customData.email.trim() && customData.email !== existing.email) {
        updates.email = customData.email.trim().toLowerCase();
      }
      if (customData.area && customData.area.trim()) {
        updates.area = customData.area.trim();
      }
      if (customData.city && customData.city.trim()) {
        updates.city = customData.city.trim();
      }

      await FirebaseService.updateDocument("users", fbUser.uid, updates);
      return { ...existing, ...updates };
    }

    const role = customData.role || defaultRole;

    // Construct customer profile with defined values satisfying isValidUser schema
    const newUser: Record<string, any> = {
      id: fbUser.uid,
      name: (customData.name || fbUser.displayName || "PickPal Customer").trim(),
      phone: (customData.phone || fbUser.phoneNumber || "").trim(),
      role,
      status: customData.status || (role === "worker" ? "pendingApproval" : "active"),
      verified: customData.verified ?? (role !== "worker"),
      walletBalance: role === "customer" ? 500 : 0,
      savedAddresses: customData.savedAddresses || [],
      createdAt: now,
      updatedAt: now,
    };

    // Only write email if an actual non-empty value exists
    const candidateEmail = (customData.email || fbUser.email || "").trim().toLowerCase();
    if (candidateEmail) {
      newUser.email = candidateEmail;
    }

    // Add optional fields ONLY if non-empty string or defined object
    if (customData.area && customData.area.trim()) {
      newUser.area = customData.area.trim();
    }
    if (customData.city && customData.city.trim()) {
      newUser.city = customData.city.trim();
    }
    if (fbUser.photoURL || customData.profileImage) {
      newUser.profileImage = customData.profileImage || fbUser.photoURL;
    }
    if (customData.workerType) {
      newUser.workerType = customData.workerType;
    }
    if (customData.address && customData.address.trim()) {
      newUser.address = customData.address.trim();
    }
    if (customData.aadhaarNumber && customData.aadhaarNumber.trim()) {
      newUser.aadhaarNumber = customData.aadhaarNumber.trim();
    }
    if (customData.panNumber && customData.panNumber.trim()) {
      newUser.panNumber = customData.panNumber.trim();
    }
    if (customData.selfie) {
      newUser.selfie = customData.selfie;
    }
    if (customData.aadhaarFront) {
      newUser.aadhaarFront = customData.aadhaarFront;
    }
    if (customData.aadhaarBack) {
      newUser.aadhaarBack = customData.aadhaarBack;
    }
    if (customData.skills && customData.skills.length > 0) {
      newUser.skills = customData.skills;
    }
    if (customData.experience && customData.experience.trim()) {
      newUser.experience = customData.experience.trim();
    }
    if (customData.serviceCategories && customData.serviceCategories.length > 0) {
      newUser.serviceCategories = customData.serviceCategories;
    }
    if (customData.bankDetails) {
      newUser.bankDetails = customData.bankDetails;
    }
    if (customData.emergencyContact) {
      newUser.emergencyContact = customData.emergencyContact;
    }

    await FirebaseService.setDocument("users", fbUser.uid, newUser as PickPalUser);
    return newUser as PickPalUser;
  }

  /**
   * Authenticates with Email & Password.
   */
  public static async loginWithEmail(email: string, pass: string): Promise<PickPalUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      throw new Error("Please enter your email and password.");
    }
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    await this.waitForAuthReady(cred.user.uid);
    return this.ensureUserDocument(cred.user);
  }

  /**
   * Confirms Firebase Phone Auth OTP code.
   * Returns authenticated PickPal user profile.
   */
  public static async confirmPhoneOtpAndLogin(
    confirmationResult: ConfirmationResult,
    otpCode: string,
    additionalProfileData: Partial<PickPalUser> = {}
  ): Promise<PickPalUser> {
    const userCredential = await OtpService.confirmPhoneOtp(confirmationResult, otpCode);
    const firebaseUser = userCredential.user;

    if (!firebaseUser || !firebaseUser.uid) {
      throw new Error("Firebase user was not returned after OTP verification");
    }

    console.log("OTP verification successful");
    console.log("Firebase UID:", firebaseUser.uid);

    await this.waitForAuthReady(firebaseUser.uid);

    console.log("Firestore profile operation started");

    const formattedPhone = firebaseUser.phoneNumber || additionalProfileData.phone || "";
    try {
      const userProfile = await this.ensureUserDocument(firebaseUser, {
        ...additionalProfileData,
        phone: formattedPhone,
      });

      console.log("[PickPal Auth Debug] Firestore profile operation succeeded");
      return userProfile;
    } catch (profileErr: any) {
      console.error(
        "Firestore profile error:",
        profileErr?.code || profileErr?.name || "permission-denied",
        profileErr?.message || "Missing or insufficient permissions."
      );
      throw profileErr;
    }
  }

  /**
   * Authenticates with Google popup provider.
   */
  public static async loginWithGoogle(role: UserRole = "customer"): Promise<PickPalUser> {
    const cred = await signInWithPopup(auth, googleProvider);
    await this.waitForAuthReady(cred.user.uid);
    return this.ensureUserDocument(cred.user, {}, role);
  }

  /**
   * Customer Email + Password Registration.
   */
  public static async registerCustomerWithEmail(
    name: string,
    phone: string,
    email: string,
    pass: string,
    location?: string
  ): Promise<PickPalUser> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = OtpService.formatE164Phone(phone);

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    await this.waitForAuthReady(cred.user.uid);
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn("Could not send email verification link:", e);
    }

    return this.ensureUserDocument(cred.user, {
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      area: location?.trim() || undefined,
      role: "customer",
      status: "active",
      verified: true,
      walletBalance: 500,
    });
  }

  /**
   * Worker Email + Password Registration.
   */
  public static async registerWorkerWithEmail(payload: WorkerRegistrationPayload): Promise<PickPalUser> {
    const { email, password, name, phone, address, city, workerType, aadhaarNumber, panNumber, selfie, aadhaarFront, aadhaarBack, skills, experience, serviceCategories, bankDetails, emergencyContact } = payload;

    if (!password) {
      throw new Error("Password is required for email registration.");
    }

    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await this.waitForAuthReady(cred.user.uid);
    const cleanPhone = OtpService.formatE164Phone(phone);

    return this.ensureUserDocument(cred.user, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      role: "worker",
      status: "pendingApproval",
      verified: false,
      workerType: workerType || "home_visit",
      city: city?.trim() || undefined,
      address: address?.trim() || undefined,
      aadhaarNumber: aadhaarNumber?.trim() || undefined,
      panNumber: panNumber?.trim() || undefined,
      selfie,
      aadhaarFront,
      aadhaarBack,
      skills: skills || [],
      experience: experience?.trim() || undefined,
      serviceCategories: serviceCategories || [],
      bankDetails,
      emergencyContact,
    });
  }

  public static async logout(): Promise<void> {
    await signOut(auth);
  }

  public static subscribeAuth(onUserChanged: (user: PickPalUser | null) => void) {
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        onUserChanged(null);
        return;
      }
      const profile = await this.getUserProfile(fbUser.uid);
      onUserChanged(profile);
    });
  }
}
