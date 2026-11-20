// Mirrors backend/firebase-blueprint.json exactly — the Firestore documents
// this app reads/writes must match these shapes or firestore.rules will reject them.

export type UserRole =
  | "customer"
  | "worker"
  | "localManager"
  | "regionalManager"
  | "superAdmin"
  | "admin"
  | "manager";

export type UserStatus = "active" | "pendingApproval" | "suspended" | "banned" | "rejected";

export interface PickPalUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  verificationStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  walletBalance?: number;
  earnings?: number;
  rating?: number;
  photoURL?: string;
  profileImage?: string;
  avatar?: string;
  idProof?: string;
  area?: string;
  city?: string;
  lat?: number;
  lng?: number;
  liveLat?: number;
  liveLng?: number;
  isAvailable?: boolean;
  radius?: number;
  maxJobsPerDay?: number;
  maxSimultaneousJobs?: number;
  servicesOffered?: string[];
  savedAddresses?: any[];
  preferences?: Record<string, any>;
  upi?: string;
  bankAccount?: string;
  ifsc?: string;
  // Worker Specific Fields
  workerType?: "home_visit" | "shop_service";
  aadhaarNumber?: string;
  panNumber?: string;
  selfie?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  address?: string;
  skills?: string[];
  experience?: string;
  serviceCategories?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  availableDays?: string[];
  otpVerified?: {
    phone: boolean;
    email: boolean;
  };
  termsAccepted?: boolean;
  completedJobsCount?: number;
  pendingPayout?: number;
  paidAmount?: number;
  bankDetails?: {
    accountNo?: string;
    ifsc?: string;
    holderName?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type ShoppingMode = "local" | "interstate" | "international";

export type ServiceCategory =
  | "silk_textiles"
  | "regional_sweets"
  | "local_markets"
  | "handicrafts_souvenirs"
  | "grocery_spices"
  | "custom_proxy"
  | "grocery"
  | "pharmacy"
  | "hardware"
  | "electronics"
  | "other";

export type OrderStatus =
  | "searching_worker"
  | "worker_assigned"
  | "travelling"
  | "arrived"
  | "in_progress"
  | "photo_verification"
  | "checkout_approvals"
  | "shipped"
  | "delivering"
  | "completed"
  | "cancelled";

export interface OrderItem {
  name: string;
  qty: number;
  price?: number;
}

export interface ShippingDetails {
  carrier?: string;
  trackingNumber?: string;
  shippingFee: number;
  estimatedDays?: string;
  customsDeclared?: boolean;
  receiptPhoto?: string;
}

export interface PhotoVerification {
  status: "pending" | "submitted" | "approved" | "rejected";
  photoUrls?: string[];
  billUrl?: string;
  itemNotes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  workerId?: string | null;
  workerName?: string | null;
  storeName: string;
  category: ServiceCategory;
  shoppingMode?: ShoppingMode;
  targetState?: string;
  targetCity?: string;
  targetMarket?: string;
  currency?: "INR" | "USD" | "EUR" | "GBP" | "AED";
  exchangeRate?: number;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  budgetCap: number;
  serviceFee?: number;
  shippingFee?: number;
  discount?: number;
  tip?: number;
  tipAmount?: number;
  paymentStatus?: "paid" | "pending" | "refunded";
  eta?: string;
  customerLat?: number;
  customerLng?: number;
  customerAddress?: string;
  customerCountry?: string;
  workerLiveLat?: number;
  workerLiveLng?: number;
  workerLiveAt?: string;
  shippingDetails?: ShippingDetails;
  photoVerification?: PhotoVerification;
  attachments?: {
    details?: string;
    images?: string[];
    videos?: string[];
    voice?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type MessageSenderRole = "customer" | "worker" | "ai" | "system";

export interface ProposedItem {
  name: string;
  price: number;
  reason?: string;
}

export interface OrderMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: MessageSenderRole;
  text: string;
  timestamp: string;
  image?: string;
  substitutionDecision?: "approved" | "declined";
  proposedItem?: ProposedItem;
}

export interface SystemLog {
  id: string;
  action: string;
  details: string;
  createdBy: string;
  timestamp?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  paymentMethod?: "UPI" | "Card" | "QR Code" | "Net Banking" | "Wallet Settlement";
  status: "success" | "pending" | "failed";
  referenceId?: string;
  timestamp: string;
}

export interface InvoiceRecord {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  workerName?: string;
  storeName: string;
  category: ServiceCategory;
  date: string;
  time?: string;
  amount: number;
  commission?: number;
  gst?: number;
  totalPaid: number;
  paymentMethod?: string;
  items: OrderItem[];
  pdfUrl?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  orderId?: string;
  type?: "order" | "payment" | "system" | "sos";
}

export interface ServiceReview {
  id: string;
  orderId: string;
  workerId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CouponDef {
  code: string;
  title: string;
  discountPercent?: number;
  discountAmount?: number;
  maxDiscount?: number;
  minOrder?: number;
  active: boolean;
}

export interface PlatformAnalytics {
  totalOrders: number;
  activeWorkers: number;
  totalRevenue: number;
  avgFulfillmentMinutes: number;
  categoryBreakdown: Record<string, number>;
}

export interface MarketplaceServiceDoc {
  id: string;
  name: string;
  title?: string;
  slug: string;
  category: string;
  subCategory: string;
  description: string;
  imageUrl: string;
  image?: string;
  icon?: string;
  bannerUrl: string;
  estimatedTime: string;
  startingPrice: number;
  price?: number;
  rating: number;
  totalBookings: number;
  active: boolean;
  featured: boolean;
  cityAvailability: string[];
  workerRequired: boolean;
  type?: "HOME_SERVICE" | "VISIT_SHOP";
  createdAt?: string;
  updatedAt?: string;
  averagePrice?: number;
  maxPrice?: number;
  inspectionFee?: number;
  priceUnit?: string;
  pricingNote?: string;
}

export interface ServiceDef {
  key: string;
  label: string;
  category: ServiceCategory;
  group: "home" | "shopping" | "pickup" | "personal";
  image: string;
  description?: string;
  startingPrice?: number;
  estimatedTime?: string;
  rating?: number;
  cityAvailability?: string[];
  type?: "HOME_SERVICE" | "VISIT_SHOP";
  averagePrice?: number;
  maxPrice?: number;
  inspectionFee?: number;
  priceUnit?: string;
  pricingNote?: string;
}

export function getServiceType(serviceKey: string, category: string): "HOME_SERVICE" | "VISIT_SHOP" {
  const visitShopKeys = [
    "laundry", "tailoring", "salon", "beautician", "barber", "spa", "tattoo", 
    "car_wash", "car_service", "bike_service", "laptop_repair", "mobile_repair", 
    "clinic", "dental_clinic", "optical_store", "pet_grooming"
  ];
  const visitShopCategories = [
    "Beauty", "Health", "Vehicle", "Laundry", "Tailoring", "Salon", "Spa", 
    "Pet Care", "Clinic", "Medical", "Dental Clinic", "Optical Store", 
    "Garage", "Service Center", "Tailoring & Alterations", "Tattoo Studio"
  ];

  const keyLower = (serviceKey || "").toLowerCase();
  const catLower = (category || "").toLowerCase();

  const isKeyMatch = visitShopKeys.some(k => keyLower.includes(k));
  const isCatMatch = visitShopCategories.some(c => catLower.includes(c.toLowerCase()));

  if (isKeyMatch || isCatMatch) {
    return "VISIT_SHOP";
  }
  return "HOME_SERVICE";
}

const U = (id: string, w = 400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const SERVICES: ServiceDef[] = [
  { key: "electrician", label: "Electrician", category: "hardware", group: "home", image: U("photo-1621905251189-08b45d6a269e") },
  { key: "plumber", label: "Plumber", category: "hardware", group: "home", image: U("photo-1607472586890-8a232d3d7b1f") },
  { key: "cleaning", label: "Cleaning", category: "other", group: "home", image: U("photo-1581578731548-c64695cc6952") },
  { key: "carpenter", label: "Carpenter", category: "hardware", group: "home", image: U("photo-1503387762-592deb58ef4e") },
  { key: "painter", label: "Painter", category: "hardware", group: "home", image: U("photo-1562259929-b4e1fd3aef09") },
  { key: "ac_repair", label: "AC Repair", category: "hardware", group: "home", image: U("photo-1556911220-bff31c812dba") },
  { key: "appliance_repair", label: "Appliance Repair", category: "electronics", group: "home", image: U("photo-1556228720-195a672e8a03") },
  { key: "gardening", label: "Gardening", category: "other", group: "home", image: U("photo-1416879595882-3373a0480b5b") },

  { key: "grocery", label: "Grocery", category: "grocery", group: "shopping", image: U("photo-1542838132-92c53300491e") },
  { key: "medicine", label: "Medicine", category: "pharmacy", group: "shopping", image: U("photo-1587854692152-cbe660dbde88") },
  { key: "electronics", label: "Electronics", category: "electronics", group: "shopping", image: U("photo-1498049794561-7780e7231661") },
  { key: "fashion", label: "Fashion", category: "other", group: "shopping", image: U("photo-1483985988355-763728e1935b") },
  { key: "pet_supplies", label: "Pet Supplies", category: "other", group: "shopping", image: U("photo-1583511655857-d19b40a7a54e") },
  { key: "gifts", label: "Gifts", category: "other", group: "shopping", image: U("photo-1513885535751-8b9238bd345a") },

  { key: "parcel", label: "Parcel", category: "other", group: "pickup", image: U("photo-1566576721346-d4a3b4eaeb55") },
  { key: "documents", label: "Documents", category: "other", group: "pickup", image: U("photo-1568667256549-094345857637") },
  { key: "food_pickup", label: "Food Pickup", category: "other", group: "pickup", image: U("photo-1504674900247-0877df9cc836") },
  { key: "cake_pickup", label: "Cake Pickup", category: "other", group: "pickup", image: U("photo-1578985545062-69928b1d9587") },
  { key: "medicine_pickup", label: "Medicine Pickup", category: "pharmacy", group: "pickup", image: U("photo-1584308666744-24d5c474f2ae") },

  { key: "laundry", label: "Laundry", category: "other", group: "personal", image: U("photo-1545173168-9f1947c5f276") },
  { key: "tailoring", label: "Tailoring", category: "other", group: "personal", image: U("photo-1556905055-8f358a7a47b2") },
  { key: "salon", label: "Salon", category: "other", group: "personal", image: U("photo-1560066984-138dadb4c035") },
  { key: "beautician", label: "Beautician", category: "other", group: "personal", image: U("photo-1570172619644-dfd03ed5d881") },
  { key: "barber", label: "Barber", category: "other", group: "personal", image: U("photo-1503951914875-452162b0f3f1") },
];

export type CallStatus = "ringing" | "connected" | "ended";

export interface IceCandidate {
  from: "caller" | "callee";
  candidate: string;
}

export interface CallSignal {
  id: string;
  orderId: string;
  callerId: string;
  calleeId: string;
  status: CallStatus;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  ice: IceCandidate[];
  createdAt?: string;
}

export type SosStatus = "open" | "resolved";

export interface SosAlert {
  id: string;
  orderId?: string | null;
  userId: string;
  userName: string;
  role: UserRole;
  lat?: number;
  lng?: number;
  reason: string;
  note?: string;
  status: SosStatus;
  createdAt?: string;
  resolvedBy?: string;
}

export type ComplaintStatus = "Open" | "Investigating" | "Resolved" | "Closed";
export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

export interface ComplaintDoc {
  id: string;
  customerId?: string;
  customerName?: string;
  workerId?: string;
  workerName?: string;
  orderId?: string;
  issue: string;
  description?: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  internalNotes?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopDoc {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingTime?: string;
  closingTime?: string;
  services?: string[];
  status: "active" | "inactive";
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueueDoc {
  id: string;
  shopId: string;
  shopName: string;
  currentToken: number;
  peopleWaiting: number;
  estimatedWaitMinutes: number;
  todayAppointmentsCount: number;
  availableSlots: number;
  status: "active" | "paused";
  updatedAt?: string;
}

export interface TokenDoc {
  id: string;
  shopId: string;
  shopName: string;
  tokenNumber: number;
  userId: string;
  userName: string;
  userPhone?: string;
  status: "waiting" | "in_progress" | "completed" | "cancelled";
  createdAt?: string;
}

