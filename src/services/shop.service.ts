import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  runTransaction,
  addDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Shop, ShopServicePackage, StaffMember, Appointment, LiveQueueState, ShopReview } from "../types/shop";

export class ShopService {
  // --- SHOP MANAGEMENT ---
  public static async registerShop(shopData: Omit<Shop, "createdAt" | "updatedAt" | "approved">): Promise<void> {
    const now = new Date().toISOString();
    const finalData: Shop = {
      ...shopData,
      approved: true, // Auto-approve for demo simplicity, admin can manage
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "shops", finalData.id), finalData);

    // Initialize live queue state for today
    const today = new Date().toISOString().split("T")[0];
    await this.initQueueState(finalData.id, today);
  }

  public static async updateShop(shopId: string, updates: Partial<Shop>): Promise<void> {
    await updateDoc(doc(db, "shops", shopId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  public static subscribeShops(onUpdate: (shops: Shop[]) => void): Unsubscribe {
    const q = query(collection(db, "shops"));
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => d.data() as Shop));
    });
  }

  public static subscribeShopById(shopId: string, onUpdate: (shop: Shop | null) => void): Unsubscribe {
    return onSnapshot(doc(db, "shops", shopId), (snap) => {
      onUpdate(snap.exists() ? (snap.data() as Shop) : null);
    });
  }

  // --- SHOP SERVICES ---
  public static async addService(service: Omit<ShopServicePackage, "id">): Promise<void> {
    const id = "srv_" + Math.random().toString(36).substring(2, 9);
    await setDoc(doc(db, "shop_services", id), { ...service, id });
  }

  public static async deleteService(id: string): Promise<void> {
    const ref = doc(db, "shop_services", id);
    await setDoc(ref, {}, { merge: false }); // simple wipe or delete
  }

  public static subscribeServices(shopId: string, onUpdate: (services: ShopServicePackage[]) => void): Unsubscribe {
    const q = query(collection(db, "shop_services"), where("shopId", "==", shopId));
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => d.data() as ShopServicePackage));
    });
  }

  // --- STAFF ---
  public static async addStaff(staff: Omit<StaffMember, "id" | "customersServedToday" | "currentQueueCount">): Promise<void> {
    const id = "stf_" + Math.random().toString(36).substring(2, 9);
    const newStaff: StaffMember = {
      ...staff,
      id,
      customersServedToday: 0,
      currentQueueCount: 0,
    };
    await setDoc(doc(db, "staff", id), newStaff);
  }

  public static async updateStaffAvailability(staffId: string, available: boolean): Promise<void> {
    await updateDoc(doc(db, "staff", staffId), { isAvailable: available });
  }

  public static subscribeStaff(shopId: string, onUpdate: (staff: StaffMember[]) => void): Unsubscribe {
    const q = query(collection(db, "staff"), where("shopId", "==", shopId));
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => d.data() as StaffMember));
    });
  }

  // --- LIVE QUEUE MANAGEMENT STATE ---
  private static async initQueueState(shopId: string, date: string): Promise<void> {
    const id = `${shopId}_${date}`;
    const snap = await getDoc(doc(db, "queue", id));
    if (!snap.exists()) {
      const qState: LiveQueueState = {
        id,
        date,
        currentRunningToken: 0,
        totalQueueCount: 0,
        lastTokenNumber: 0,
      };
      await setDoc(doc(db, "queue", id), qState);
    }
  }

  public static subscribeQueueState(shopId: string, date: string, onUpdate: (qState: LiveQueueState | null) => void): Unsubscribe {
    const id = `${shopId}_${date}`;
    return onSnapshot(doc(db, "queue", id), (snap) => {
      onUpdate(snap.exists() ? (snap.data() as LiveQueueState) : null);
    });
  }

  // --- BOOKING FLOW & DUAL TRANSACTION QUEUEING ---
  public static async bookAppointment(booking: Omit<Appointment, "id" | "bookingId" | "queueNumber" | "otp" | "createdAt">): Promise<Appointment> {
    const appointmentId = "apt_" + Math.random().toString(36).substring(2, 11);
    const dateStr = booking.date;
    const queueStateId = `${booking.shopId}_${dateStr}`;

    // Ensure queue state object is ready for today
    await this.initQueueState(booking.shopId, dateStr);

    const result = await runTransaction(db, async (transaction) => {
      const queueRef = doc(db, "queue", queueStateId);
      const queueSnap = await transaction.get(queueRef);

      let lastToken = 1;
      let totalQueue = 1;
      let currentRunning = 0;

      if (queueSnap.exists()) {
        const qData = queueSnap.data() as LiveQueueState;
        lastToken = qData.lastTokenNumber + 1;
        totalQueue = qData.totalQueueCount + 1;
        currentRunning = qData.currentRunningToken;
      }

      // Generate parameters
      const bookingId = `PKP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const queueNumber = `Q-${lastToken}`;
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const createdAt = new Date().toISOString();

      const newAppointment: Appointment = {
        ...booking,
        id: appointmentId,
        bookingId,
        queueNumber,
        otp,
        createdAt,
      };

      // Set appointment
      transaction.set(doc(db, "appointments", appointmentId), newAppointment);

      // Update queue state
      transaction.update(queueRef, {
        lastTokenNumber: lastToken,
        totalQueueCount: totalQueue,
        currentRunningToken: currentRunning === 0 ? lastToken : currentRunning,
      });

      return newAppointment;
    });

    return result;
  }

  // --- OWNER FLOW CONTROLLER ---
  public static async checkInAppointment(appointmentId: string): Promise<void> {
    await updateDoc(doc(db, "appointments", appointmentId), { status: "checked_in" });
  }

  public static async skipAppointment(appointmentId: string): Promise<void> {
    await updateDoc(doc(db, "appointments", appointmentId), { status: "skipped" });
  }

  public static async completeAppointment(appointmentId: string, shopId: string, date: string, staffId: string | null): Promise<void> {
    const queueStateId = `${shopId}_${date}`;

    await runTransaction(db, async (transaction) => {
      // 1. Mark appointment as completed
      transaction.update(doc(db, "appointments", appointmentId), { status: "completed" });

      // 2. Fetch current queue state to progress currentRunningToken
      const queueRef = doc(db, "queue", queueStateId);
      const queueSnap = await transaction.get(queueRef);

      if (queueSnap.exists()) {
        const qData = queueSnap.data() as LiveQueueState;
        // Move to next token number
        const nextToken = qData.currentRunningToken + 1;
        transaction.update(queueRef, {
          currentRunningToken: Math.min(nextToken, qData.lastTokenNumber),
        });
      }

      // 3. Update staff served metrics
      if (staffId) {
        const staffRef = doc(db, "staff", staffId);
        const staffSnap = await transaction.get(staffRef);
        if (staffSnap.exists()) {
          const staffData = staffSnap.data() as StaffMember;
          transaction.update(staffRef, {
            customersServedToday: (staffData.customersServedToday || 0) + 1,
          });
        }
      }
    });
  }

  public static async addWalkInCustomer(shopId: string, shopName: string, name: string, phone: string, serviceName: string, price: number, staffId: string | null, staffName: string | null): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    await this.bookAppointment({
      shopId,
      shopName,
      customerId: "walkin_" + Math.random().toString(36).substring(2, 9),
      customerName: name,
      customerPhone: phone,
      serviceId: "walkin_srv",
      serviceName,
      price,
      staffId,
      staffName,
      date: today,
      timeSlot: new Date().toTimeString().split(" ")[0].substring(0, 5), // current HH:MM
      status: "checked_in", // Checked in directly
    });
  }

  public static async cancelAppointment(appointmentId: string): Promise<void> {
    await updateDoc(doc(db, "appointments", appointmentId), { status: "cancelled" });
  }

  // --- REAL-TIME APPOINTMENTS LISTENERS ---
  public static subscribeAppointmentsByCustomer(customerId: string, onUpdate: (appointments: Appointment[]) => void): Unsubscribe {
    const q = query(
      collection(db, "appointments"),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => d.data() as Appointment));
    });
  }

  public static subscribeAppointmentsByShopAndDate(shopId: string, date: string, onUpdate: (appointments: Appointment[]) => void): Unsubscribe {
    const q = query(
      collection(db, "appointments"),
      where("shopId", "==", shopId),
      where("date", "==", date),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => d.data() as Appointment));
    });
  }

  public static subscribeAppointmentById(appointmentId: string, onUpdate: (apt: Appointment | null) => void): Unsubscribe {
    return onSnapshot(doc(db, "appointments", appointmentId), (snap) => {
      onUpdate(snap.exists() ? (snap.data() as Appointment) : null);
    });
  }

  // --- REVIEWS ---
  public static async addShopReview(review: Omit<ShopReview, "id" | "createdAt">): Promise<void> {
    const id = "rev_" + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    await setDoc(doc(db, "shop_reviews", id), { ...review, id, createdAt });

    // Update aggregate rating
    const q = query(collection(db, "shop_reviews"), where("shopId", "==", review.shopId));
    const snap = await getDocs(q);
    const reviews = snap.docs.map((d) => d.data() as ShopReview);
    const avg = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    await updateDoc(doc(db, "shops", review.shopId), {
      rating: parseFloat(avg.toFixed(1)),
      reviewsCount: reviews.length,
    });
  }

  public static subscribeShopReviews(shopId: string, onUpdate: (reviews: ShopReview[]) => void): Unsubscribe {
    const q = query(collection(db, "shop_reviews"), where("shopId", "==", shopId), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => d.data() as ShopReview));
    });
  }
}
