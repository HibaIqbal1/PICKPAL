import { PickPalUser, UserStatus } from "../types";
import { FirebaseService } from "./firebase.service";

export class AdminService {
  public static async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    await FirebaseService.updateDocument("users", userId, { status });
  }

  public static async verifyWorker(workerId: string, verified: boolean): Promise<void> {
    await FirebaseService.updateDocument("users", workerId, { verified });
  }
}
