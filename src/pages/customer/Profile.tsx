import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { PageContainer } from "../../components/ui/PageContainer";
import {
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Settings,
  Edit3,
  Camera,
  AlertTriangle,
  Trash2,
  Plus,
  Loader2,
  X,
  Check,
  PackageCheck,
  Tag,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileService } from "../../services/profile.service";
import { LocationService } from "../../services/location.service";
import { BookingService } from "../../services/booking.service";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Order } from "../../types";

interface SavedAddress {
  label: string;
  addressText: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
}

const customMarkerIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:24px;height:24px;background:#E8236B;border-radius:9999px;border:2px solid #fff;box-shadow:0 1.5px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
    <div style="width:8px;height:8px;background:#fff;border-radius:9999px;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function CustomerProfile() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState("Home");
  const [addressText, setAddressText] = useState("");
  const [markerPos, setMarkerPos] = useState<[number, number]>([12.9716, 77.5946]);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarError, setAvatarError] = useState("");

  // Live Orders Data
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = BookingService.subscribeCustomerBookings(profile.id, (orders) => {
      setUserOrders(orders);
    });
    return () => unsub();
  }, [profile?.id]);

  const openEditModal = () => {
    if (profile) {
      setEditName(profile.name || "");
      setEditPhone(profile.phone || "");
      setEditModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    try {
      await ProfileService.updateProfile(profile.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      setEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file.");
      return;
    }

    setUploadingAvatar(true);
    setUploadProgress(0);
    setAvatarError("");

    try {
      await ProfileService.uploadAvatar(profile.id, file, (pct) => {
        setUploadProgress(pct);
      });
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setAvatarError("Failed to upload image. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    const el = document.documentElement;
    if (darkMode) {
      el.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      el.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (modalOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setMarkerPos([latitude, longitude]);
          fetchAddress(latitude, longitude);
        },
        null,
        { enableHighAccuracy: true }
      );
    }
  }, [modalOpen]);

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-bold text-gray-500">Loading profile…</div>;
  }

  const addresses: SavedAddress[] = profile.savedAddresses || [];

  const completedOrders = userOrders.filter((o) => o.status === "completed");
  const ordersCount = completedOrders.length;

  const totalSaved = completedOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

  const displayRating = profile.rating ? profile.rating.toFixed(1) : "No ratings yet";
  const displayAvatar = profile.photoURL || profile.avatar || profile.profileImage;

  const fetchAddress = async (lat: number, lng: number) => {
    setFetchingAddress(true);
    try {
      const resolved = await LocationService.reverseGeocode(lat, lng);
      setAddressText(resolved);
    } catch (err) {
      console.error("Geocoding failed:", err);
      setAddressText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setFetchingAddress(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    fetchAddress(lat, lng);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      await ProfileService.addSavedAddress(profile.id, {
        label,
        addressText,
        lat: markerPos[0],
        lng: markerPos[1],
      });

      setModalOpen(false);
      setAddressText("");
      setLabel("Home");
    } catch (err) {
      console.error("Address save failed:", err);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (labelToDelete: string) => {
    await ProfileService.deleteSavedAddress(profile.id, labelToDelete);
  };

  const handleSetDefault = async (addr: SavedAddress) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.label === addr.label,
    }));
    await ProfileService.updateProfile(profile.id, {
      savedAddresses: updated,
      area: `${addr.label} (${addr.addressText.split(",")[0]})`,
      lat: addr.lat,
      lng: addr.lng,
    });
  };

  return (
    <PageContainer
      title="User Profile"
      subtitle="Manage your personal details and saved delivery addresses"
      narrow
    >
      {/* Hidden File Input for Avatar Selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleAvatarFileSelect}
        className="hidden"
      />

      {/* Profile Header */}
      <div className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl p-6 mb-6 shadow-sm">
        <div className="flex items-end space-x-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-800 shadow-lg overflow-hidden bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center relative">
              {displayAvatar ? (
                <img src={displayAvatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-brand-500">{(profile.name || "U").charAt(0).toUpperCase()}</span>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-2 text-center">
                  <Loader2 size={20} className="animate-spin mb-1" />
                  <span className="text-[10px] font-bold">{uploadProgress}%</span>
                </div>
              )}
            </div>

            <motion.button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-zinc-800 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors border border-black/5 dark:border-white/10"
              whileTap={{ scale: 0.9 }}
              title="Change profile picture"
            >
              <Camera size={16} className="text-gray-600 dark:text-zinc-300" />
            </motion.button>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-ink dark:text-zinc-100">{profile.name}</h1>
            <p className="text-ink-soft dark:text-zinc-400 text-sm mt-1 flex items-center gap-1">
              <MapPin size={14} className="text-brand-500 shrink-0" />
              <span className="truncate">{profile.area || "Location not set"}</span>
              {profile.verified && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 shrink-0 ml-1">
                  Verified
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Upload Error Banner */}
        {avatarError && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 p-2.5 rounded-xl border border-red-200 dark:border-red-500/20 mt-3">
            {avatarError}
          </p>
        )}

        {/* Real-time Dynamic Statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-black/5 dark:border-white/5 pt-4">
          <div className="text-center">
            <p className="text-xl font-bold text-ink dark:text-zinc-100">₹{totalSaved}</p>
            <p className="text-xs text-ink-soft dark:text-zinc-400">Total Saved</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-ink dark:text-zinc-100">{ordersCount}</p>
            <p className="text-xs text-ink-soft dark:text-zinc-400">Completed Orders</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-ink dark:text-zinc-100">{displayRating}</p>
            <p className="text-xs text-ink-soft dark:text-zinc-400">Rating</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Edit Profile", icon: Edit3, color: "text-brand-500 bg-brand-50 dark:bg-brand-500/10", action: openEditModal },
          { label: "Emergency", icon: AlertTriangle, color: "text-red-500 bg-red-50 dark:bg-red-500/10", action: () => alert("Emergency alert notified to support!") },
          { label: "Payments", icon: CreditCard, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10", action: () => navigate("/customer/wallet") },
          { label: "Dark Mode", icon: Settings, color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10", action: () => setDarkMode(!darkMode) },
        ].map((act, i) => (
          <motion.button
            key={i}
            onClick={act.action}
            className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center space-y-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${act.color}`}>
              <act.icon size={18} />
            </div>
            <span className="text-[10px] font-bold text-ink-soft dark:text-zinc-400">{act.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Profile Sections */}
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl p-5 shadow-sm">
          <h2 className="text-base font-display font-bold text-ink dark:text-zinc-100 mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-soft dark:text-zinc-400">Email Address</p>
                  <p className="text-xs text-ink dark:text-zinc-200 mt-0.5">{profile.email?.toLowerCase() || "Not set"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-soft dark:text-zinc-400">Mobile Number</p>
                  <p className="text-xs text-ink dark:text-zinc-200 mt-0.5">{profile.phone ? `+${profile.phone}` : "Not set"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Addresses Section */}
        <div className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-display font-bold text-ink dark:text-zinc-100">Saved Delivery Addresses</h2>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-brand-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Plus size={14} /> Add Address
            </button>
          </div>

          <div className="space-y-2 mt-2">
            {addresses.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
                <MapPin size={24} className="mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
                <p className="text-xs font-bold text-ink-soft dark:text-zinc-400">No saved addresses yet</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">Click Add Address above to pin your home or work location.</p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.label}
                  className={`flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all ${
                    addr.isDefault
                      ? "bg-brand-50/40 border-brand-500/20 dark:bg-brand-500/5"
                      : "bg-gray-50/50 dark:bg-zinc-850/50 border-black/5 dark:border-white/5"
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        addr.isDefault ? "bg-brand-500 text-white" : "bg-gray-200 dark:bg-zinc-800 text-ink-soft dark:text-zinc-400"
                      }`}
                    >
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-ink dark:text-zinc-100">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="bg-mint-100 dark:bg-mint-600/10 text-mint-600 dark:text-mint-400 font-extrabold text-[8px] tracking-wide uppercase px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-soft dark:text-zinc-400 mt-1 leading-normal">{addr.addressText}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr)}
                        className="text-[9px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 px-2 py-1.5 rounded-lg"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr.label)}
                      className="p-1.5 text-ink-soft dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                      title="Delete address"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-8">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full py-3 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100/60 dark:hover:bg-red-500/20 rounded-2xl font-bold transition-colors text-xs"
        >
          Logout
        </button>
      </div>

      {/* Add Address Modal with Map */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="font-display font-black text-sm text-ink dark:text-zinc-100">Add New Address</h3>
                  <p className="text-[10px] text-ink-soft dark:text-zinc-400 mt-0.5">Click on the map to pin your location</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-ink-soft dark:text-zinc-400"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="h-48 w-full rounded-2xl overflow-hidden border border-black/10 shadow-inner relative">
                  <MapContainer center={markerPos} zoom={14} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents onMapClick={handleMapClick} />
                    <Marker position={markerPos} icon={customMarkerIcon} />
                  </MapContainer>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Address Label (e.g. Home, Work)</label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Home"
                    className="w-full text-xs rounded-xl px-3 py-2 bg-transparent border border-black/10 dark:border-white/10 outline-none text-ink dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Fetched Address</label>
                    {fetchingAddress && (
                      <span className="text-[10px] text-brand-600 font-bold flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Fetching address…
                      </span>
                    )}
                  </div>
                  <textarea
                    required
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder="Pin location on map above to load address"
                    className="w-full text-xs p-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent outline-none h-20 text-ink dark:text-zinc-100 leading-normal"
                  />
                </div>

                <div className="text-[10px] text-ink-soft dark:text-zinc-400 font-mono">
                  Coordinates: {markerPos[0].toFixed(6)}°N, {markerPos[1].toFixed(6)}°E
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-ink-soft dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress || fetchingAddress || !addressText}
                    className="bg-brand-500 text-white px-5 py-2.5 rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {savingAddress ? "Saving…" : <><Check size={14} /> Add Address</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3">
                <h3 className="font-display font-black text-sm text-ink dark:text-zinc-100">Edit Profile</h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-ink-soft dark:text-zinc-400"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Your Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2 bg-transparent border border-black/10 dark:border-white/10 outline-none text-ink dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2 bg-transparent border border-black/10 dark:border-white/10 outline-none text-ink dark:text-zinc-100"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-ink-soft dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-brand-500 text-white px-4 py-2 rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {savingProfile ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}