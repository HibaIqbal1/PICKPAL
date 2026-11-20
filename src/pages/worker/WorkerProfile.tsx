import React, { useState, useEffect } from "react";
import { User, CreditCard, HelpCircle, Save, CheckCircle2, ChevronDown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { PageContainer, SectionCard } from "../../components/ui/PageContainer";

const FAQS = [
  { q: "How do I get paid?", a: "Earnings are deposited directly to your bank account or UPI address every Wednesday morning." },
  { q: "What is my service radius?", a: "Your matching radius determines which job requests appear. You can increase this in the Services tab up to 20 km." },
  { q: "Why am I not receiving job requests?", a: "Make sure you have toggled your status to Online in the dashboard, checked your service checklist, and that your location permissions are enabled." },
  { q: "How can I appeal a cancellation?", a: "If a job was cancelled due to no fault of yours, you can contact PickPal Support via help@pickpal.com with the Order ID." },
];

export default function WorkerProfile() {
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [upi, setUpi] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setArea(profile.area || "");
      setUpi(profile.upi || "");
      setBankAccount(profile.bankAccount || "");
      setIfsc(profile.ifsc || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSuccess(false);
    try {
      await updateDoc(doc(db, "users", profile.id), {
        name,
        phone,
        area,
        upi,
        bankAccount,
        ifsc,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="Worker Profile & Settings"
      subtitle="Edit your operational details, update bank accounts, and get help resources"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Form */}
        <div className="md:col-span-2">
          <SectionCard
            title="Personal Details"
            icon={<User size={18} className="text-indigo-500" />}
          >
            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-black/10 dark:border-white/10 bg-transparent text-ink dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-black/10 dark:border-white/10 bg-transparent text-ink dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Locality / Operational Area</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-black/10 dark:border-white/10 bg-transparent text-ink dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <h3 className="text-xs font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider pt-4 flex items-center gap-2 border-t border-black/5 dark:border-white/5">
                <CreditCard size={14} className="text-indigo-500" />
                Payout Information
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">UPI ID (e.g. name@okhdfcbank)</label>
                <input
                  type="text"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-black/10 dark:border-white/10 bg-transparent text-ink dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-black/10 dark:border-white/10 bg-transparent text-ink dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">IFSC Code</label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-black/10 dark:border-white/10 bg-transparent text-ink dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                {success && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Profile updated successfully!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="ml-auto btn-gradient-indigo text-white font-bold px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : <><Save size={14} /> Save Profile</>}
                </button>
              </div>
            </form>
          </SectionCard>
        </div>

        {/* FAQs Panel */}
        <div>
          <SectionCard
            title="Help & Support"
            icon={<HelpCircle size={18} className="text-indigo-500" />}
          >
            <div className="space-y-3 pt-1">
              {FAQS.map((faq, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={idx} className="border-b border-black/5 dark:border-white/5 pb-3 last:border-b-0 last:pb-0">
                    <button
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="w-full flex justify-between items-center text-left text-xs font-bold text-ink dark:text-zinc-200 hover:text-indigo-500 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={14} className={`transform transition-transform duration-205 ${open ? "rotate-180 text-indigo-500" : "text-ink-soft"}`} />
                    </button>
                    {open && (
                      <p className="text-[11px] text-ink-soft dark:text-zinc-400 mt-2 bg-black/3 dark:bg-white/3 p-2.5 rounded-xl leading-relaxed">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}
