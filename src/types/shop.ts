export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  category: string; // e.g. "Salon", "Mechanic", "Doctor", "Laundry"
  description: string;
  address: string;
  coverImage: string;
  logoUrl: string;
  contactNumber: string;
  lat: number;
  lng: number;
  rating: number;
  reviewsCount: number;
  amenities: string[]; // e.g. ["AC", "UPI Accepted", "Parking", "Wheelchair Accessible"]
  workingHours: {
    open: string;  // e.g. "09:00"
    close: string; // e.g. "21:00"
    lunchStart?: string; // e.g. "13:00"
    lunchEnd?: string;   // e.g. "14:00"
    holidays?: string[]; // e.g. ["Sunday"]
  };
  slotDuration: number; // e.g. 15, 30, 45, 60 minutes
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShopServicePackage {
  id: string;
  shopId: string;
  name: string;
  price: number;
  duration: number; // in minutes
  category: string;
  description: string;
}

export interface StaffMember {
  id: string;
  shopId: string;
  name: string;
  photoUrl: string;
  experience: string;
  rating: number;
  isAvailable: boolean;
  customersServedToday: number;
  currentQueueCount: number;
}

export interface Appointment {
  id: string;
  shopId: string;
  shopName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  price: number;
  staffId: string | null;
  staffName: string | null;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  status: "confirmed" | "checked_in" | "completed" | "cancelled" | "skipped";
  bookingId: string; // e.g. PKP-2026-000124
  queueNumber: string; // e.g. Q-18
  otp: string; // 4-digit verification code e.g. "5472"
  createdAt: string;
}

export interface LiveQueueState {
  id: string; // shopId
  date: string; // YYYY-MM-DD
  currentRunningToken: number; // e.g. 16
  totalQueueCount: number; // e.g. 20
  lastTokenNumber: number; // e.g. 20
}

export interface ShopReview {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
