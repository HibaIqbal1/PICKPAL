import { FirebaseService } from "./firebase.service";

export class TrackingService {
  public static async updateWorkerLocation(workerId: string, lat: number, lng: number): Promise<void> {
    await FirebaseService.updateDocument("users", workerId, {
      liveLat: lat,
      liveLng: lng,
    });
  }

  public static async updateOrderWorkerLocation(orderId: string, lat: number, lng: number): Promise<void> {
    await FirebaseService.updateDocument("orders", orderId, {
      workerLiveLat: lat,
      workerLiveLng: lng,
      workerLiveAt: new Date().toISOString(),
    });
  }
}
