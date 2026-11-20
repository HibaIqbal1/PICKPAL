import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone, Mail, MapPin, IdCard, Camera, ShieldCheck, Clock, FileText,
  Briefcase, CreditCard, AlertCircle, CheckCircle2, Store, UserCheck, Lock
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { WorkerService } from "../../services/worker.service";
import { Button } from "../../components/ui/Button";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WorkerOnboarding() {
  const { profile, isPendingApproval, logout } = useAuth();
  const navigate = useNavigate();

  // Basic Info & Type
  const [fullName, setFullName] = useState(profile?.name || "");
  const [workerType, setWorkerType] = useState<"home_visit" | "shop_service">(
    profile?.workerType || "home_visit"
  );
  const [city, setCity] = useState(profile?.city || "Bengaluru");
  const [address, setAddress] = useState(profile?.address || profile?.area || "");
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || profile?.avatar || "");

  // Contact & OTP
  const [phone, setPhone] = useState(profile?.phone || "");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(profile?.otpVerified?.phone ?? false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  const [email, setEmail] = useState(profile?.email || "");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(profile?.otpVerified?.email ?? true);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // Experience, Skills & Schedule
  const [skills, setSkills] = useState(profile?.skills?.join(", ") || "Proxy Shopping, Silk Verification, Market Sourcing, Courier Dispatch");
  const [experience, setExperience] = useState(profile?.experience || "2 Years");
  const [serviceCategories, setServiceCategories] = useState("Silks & Textiles, Regional Sweets & Gourmet, Famous Bazaars, NRI Courier");
  const [startTime, setStartTime] = useState(profile?.workingHours?.start || "09:00");
  const [endTime, setEndTime] = useState(profile?.workingHours?.end || "18:00");
  const [availableDays, setAvailableDays] = useState<string[]>(
    profile?.availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  );

  // Identity Verification
  const [aadhaarNumber, setAadhaarNumber] = useState(profile?.aadhaarNumber || "");
  const [panNumber, setPanNumber] = useState(profile?.panNumber || "");
  const [selfie, setSelfie] = useState(profile?.selfie || "");
  const [aadhaarFront, setAadhaarFront] = useState(profile?.aadhaarFront || "");
  const [aadhaarBack, setAadhaarBack] = useState(profile?.aadhaarBack || "");

  // Bank & Payout Details
  const [upi, setUpi] = useState(profile?.upi || "");
  const [bankAccount, setBankAccount] = useState(profile?.bankDetails?.accountNo || profile?.bankAccount || "");
  const [ifsc, setIfsc] = useState(profile?.bankDetails?.ifsc || profile?.ifsc || "");
  const [holderName, setHolderName] = useState(profile?.bankDetails?.holderName || profile?.name || "");

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState(profile?.emergencyContact?.name || "");
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergencyContact?.phone || "");
  const [emergencyRelation, setEmergencyRelation] = useState(profile?.emergencyContact?.relation || "Spouse");

  // Terms Consent & Submission State
  const [termsAccepted, setTermsAccepted] = useState(profile?.termsAccepted ?? false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(profile?.status === "pendingApproval");

  if (!profile) return null;

  const handleVerifyPhone = async () => {
    if (!phoneOtp || phoneOtp.length < 4) return;
    setVerifyingPhone(true);
    const valid = await WorkerService.verifyOtp("phone", phone, phoneOtp);
    if (valid) {
      setPhoneVerified(true);
    } else {
      alert("Invalid OTP code. Use code '123456' for verification.");
    }
    setVerifyingPhone(false);
  };

  const handleVerifyEmail = async () => {
    if (!emailOtp || emailOtp.length < 4) return;
    setVerifyingEmail(true);
    const valid = await WorkerService.verifyOtp("email", email, emailOtp);
    if (valid) {
      setEmailVerified(true);
    } else {
      alert("Invalid OTP code. Use code '123456' for verification.");
    }
    setVerifyingEmail(false);
  };

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      alert("Please accept the terms and conditions to submit your worker application.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", profile.id), {
        name: fullName.trim() || profile.name,
        workerType,
        city: city.trim(),
        address: address.trim(),
        area: address.trim(),
        photoURL: photoURL.trim() || profile.photoURL || undefined,
        avatar: photoURL.trim() || profile.avatar || undefined,
        phone: phone.trim(),
        email: email.trim(),
        otpVerified: {
          phone: phoneVerified,
          email: emailVerified,
        },
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience: experience.trim(),
        serviceCategories: serviceCategories.split(",").map((s) => s.trim()).filter(Boolean),
        workingHours: { start: startTime, end: endTime },
        availableDays,
        aadhaarNumber: aadhaarNumber.trim(),
        panNumber: panNumber.trim(),
        selfie: selfie.trim() || undefined,
        aadhaarFront: aadhaarFront.trim() || undefined,
        aadhaarBack: aadhaarBack.trim() || undefined,
        upi: upi.trim(),
        bankAccount: bankAccount.trim(),
        ifsc: ifsc.trim(),
        bankDetails: {
          accountNo: bankAccount.trim(),
          ifsc: ifsc.trim(),
          holderName: holderName.trim(),
        },
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relation: emergencyRelation.trim(),
        },
        termsAccepted: true,
        status: "pendingApproval",
        updatedAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Worker onboarding update error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-mesh-worker flex items-center justify-center p-4">
      <main className="max-w-2xl w-full glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-black/5 dark:border-white/5 shadow-2xl bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck size={24} color="#fff" />
          </div>
          <button
            onClick={() => logout().then(() => navigate("/login"))}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Log out
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-display font-extrabold text-ink dark:text-zinc-50 leading-tight">
            Worker Registration & Verification
          </h1>
          <p className="text-xs text-ink-soft dark:text-zinc-400 mt-1">
            Complete your worker onboarding profile and identity verification to start accepting customer orders.
          </p>
        </div>

        {profile?.status === "rejected" || profile?.verificationStatus === "rejected" ? (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-500/15 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-rose-900 dark:text-rose-300">
              Application Rejected
            </h2>
            <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-rose-200 dark:border-rose-500/30 max-w-md mx-auto text-left space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Reason from Manager</p>
              <p className="text-xs text-ink dark:text-zinc-200 font-medium">
                {profile?.rejectionReason || "Application details required revision. Please update your document details and resubmit."}
              </p>
            </div>
            <div className="pt-3 flex justify-center gap-3">
              <Button variant="secondary" onClick={() => logout().then(() => navigate("/login"))} className="text-xs py-2.5 px-5">
                Log Out
              </Button>
              <Button variant="indigo" onClick={() => setSubmitted(false)} className="text-xs py-2.5 px-5">
                Resubmit Application
              </Button>
            </div>
          </div>
        ) : (submitted && !profile?.status) || isPendingApproval ? (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <Clock size={32} />
            </div>
            <h2 className="text-xl font-bold text-amber-900 dark:text-amber-300">
              Application Under Verification Review
            </h2>
            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed max-w-md mx-auto">
              Your worker profile, identity documents, and payout details have been submitted to your local area manager for review. You will be activated shortly.
            </p>
            <div className="pt-3 flex justify-center gap-3">
              <Button variant="secondary" onClick={() => logout().then(() => navigate("/login"))} className="text-xs py-2.5 px-5">
                Return to Login
              </Button>
              {workerType === "shop_service" && (
                <Button variant="indigo" onClick={() => navigate("/worker/shop-setup")} className="text-xs py-2.5 px-5">
                  Set Up Shop & Services
                </Button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            {/* Step 1: Worker Category & Type */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                1. Service Model & Worker Category
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setWorkerType("home_visit")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    workerType === "home_visit"
                      ? "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-50 dark:bg-zinc-800/40 border-gray-200 dark:border-zinc-700 text-ink-soft dark:text-zinc-400"
                  }`}
                >
                  <UserCheck size={24} className="shrink-0 text-indigo-500" />
                  <div>
                    <p className="font-bold text-sm text-ink dark:text-zinc-100">Home Visit Worker</p>
                    <p className="text-[11px] text-ink-soft dark:text-zinc-400 mt-0.5">I travel to the customer's location</p>
                  </div>
                </div>

                <div
                  onClick={() => setWorkerType("shop_service")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    workerType === "shop_service"
                      ? "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-50 dark:bg-zinc-800/40 border-gray-200 dark:border-zinc-700 text-ink-soft dark:text-zinc-400"
                  }`}
                >
                  <Store size={24} className="shrink-0 text-indigo-500" />
                  <div>
                    <p className="font-bold text-sm text-ink dark:text-zinc-100">Shop / Business Service</p>
                    <p className="text-[11px] text-ink-soft dark:text-zinc-400 mt-0.5">Customers visit my physical shop</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Basic Info & Operational Location */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                2. Contact & Operational Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Full Name</label>
                  <input
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">City</label>
                  <input
                    required
                    placeholder="City (e.g. Bengaluru)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Service Locality & Address</label>
                <div className="flex items-center gap-2.5 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 bg-gray-50 dark:bg-zinc-800/50">
                  <MapPin size={16} className="text-gray-400 shrink-0" />
                  <input
                    required
                    placeholder="Full Address & Service Area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="flex-1 outline-none text-sm bg-transparent text-ink dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Profile Photo URL</label>
                <div className="flex items-center gap-2.5 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 bg-gray-50 dark:bg-zinc-800/50">
                  <Camera size={16} className="text-gray-400 shrink-0" />
                  <input
                    placeholder="https://..."
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="flex-1 outline-none text-sm bg-transparent text-ink dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Contact Verification with OTP */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                3. Phone & Email Verification
              </h3>

              {/* Phone OTP */}
              <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink dark:text-zinc-200">
                    <Phone size={15} className="text-indigo-500" /> Phone Verification
                  </div>
                  {phoneVerified && (
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 rounded-xl px-3 py-2 text-xs outline-none border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100"
                  />
                  {!phoneVerified && (
                    <>
                      <input
                        type="text"
                        placeholder="OTP Code (123456)"
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        className="w-32 rounded-xl px-3 py-2 text-xs outline-none border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhone}
                        disabled={verifyingPhone}
                        className="btn-gradient-indigo text-white font-bold text-xs px-3.5 py-2 rounded-xl shrink-0"
                      >
                        Verify
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Email OTP */}
              <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink dark:text-zinc-200">
                    <Mail size={15} className="text-indigo-500" /> Email Verification
                  </div>
                  {emailVerified && (
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-xl px-3 py-2 text-xs outline-none border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100"
                  />
                  {!emailVerified && (
                    <>
                      <input
                        type="text"
                        placeholder="OTP Code"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        className="w-32 rounded-xl px-3 py-2 text-xs outline-none border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        disabled={verifyingEmail}
                        className="btn-gradient-indigo text-white font-bold text-xs px-3.5 py-2 rounded-xl shrink-0"
                      >
                        Verify
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Step 4: Skills, Experience & Schedule */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                4. Skills, Experience & Availability Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Skills</label>
                  <input
                    required
                    placeholder="e.g. Electrician, Plumbing, AC Repair"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full rounded-2xl px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Experience</label>
                  <input
                    required
                    placeholder="e.g. 3 Years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full rounded-2xl px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Shift Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-2xl px-4 py-2 text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Shift End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-2xl px-4 py-2 text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Available Working Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const active = availableDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          active
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                            : "bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-ink-soft dark:text-zinc-400"
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 5: ID Verification Documents */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                5. Government Identity Verification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 bg-gray-50 dark:bg-zinc-800/50">
                  <IdCard size={16} className="text-gray-400 shrink-0" />
                  <input
                    required
                    placeholder="Aadhaar Number (12 digits)"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="flex-1 outline-none text-sm bg-transparent text-ink dark:text-zinc-100"
                  />
                </div>
                <div className="flex items-center gap-2.5 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 bg-gray-50 dark:bg-zinc-800/50">
                  <FileText size={16} className="text-gray-400 shrink-0" />
                  <input
                    required
                    placeholder="PAN Number"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    className="flex-1 outline-none text-sm bg-transparent text-ink dark:text-zinc-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  placeholder="Selfie Photo URL"
                  value={selfie}
                  onChange={(e) => setSelfie(e.target.value)}
                  className="rounded-xl px-3 py-2 text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                />
                <input
                  placeholder="Aadhaar Front Image URL"
                  value={aadhaarFront}
                  onChange={(e) => setAadhaarFront(e.target.value)}
                  className="rounded-xl px-3 py-2 text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                />
                <input
                  placeholder="Aadhaar Back Image URL"
                  value={aadhaarBack}
                  onChange={(e) => setAadhaarBack(e.target.value)}
                  className="rounded-xl px-3 py-2 text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                />
              </div>
            </div>

            {/* Step 6: Payout Bank & UPI Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                6. Bank & UPI Payout Details
              </h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">UPI ID</label>
                <input
                  placeholder="e.g. username@upi"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  className="w-full rounded-2xl px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  required
                  placeholder="Bank Account No."
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="rounded-xl px-3 py-2 text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                />
                <input
                  required
                  placeholder="IFSC Code"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  className="rounded-xl px-3 py-2 text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                />
                <input
                  required
                  placeholder="Account Holder Name"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="rounded-xl px-3 py-2 text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 outline-none"
                />
              </div>
            </div>

            {/* Step 7: Terms Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/30">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-indigo-600 rounded"
                />
                <span className="text-xs text-ink dark:text-zinc-300 leading-relaxed">
                  I agree to the <strong>PickPal Partner Terms of Service</strong>, code of conduct, platform commission deductions, and safety policies. I confirm that all provided identity information is accurate.
                </span>
              </label>
            </div>

            <Button type="submit" disabled={saving} className="w-full py-4 text-sm font-bold shadow-lg">
              {saving ? "Submitting for Verification..." : "Submit Registration & Verification Docs"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
