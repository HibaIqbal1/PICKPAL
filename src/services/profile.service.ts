import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";
import { PickPalUser } from "../types";
import { FirebaseService } from "./firebase.service";

export class ProfileService {
  public static async updateProfile(userId: string, data: Partial<PickPalUser>): Promise<void> {
    await FirebaseService.updateDocument("users", userId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  public static async uploadAvatar(
    userId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const storageRef = ref(storage, `avatars/${userId}/${Date.now()}.${fileExt}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      const downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            if (onProgress) onProgress(pct);
          },
          (error) => {
            console.warn("Storage upload failed, falling back to data URL:", error);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      await this.updateProfile(userId, {
        photoURL: downloadUrl,
        avatar: downloadUrl,
        profileImage: downloadUrl,
      });

      return downloadUrl;
    } catch {
      // Base64 fallback if storage bucket permissions are not initialized
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          try {
            await this.updateProfile(userId, {
              photoURL: dataUrl,
              avatar: dataUrl,
              profileImage: dataUrl,
            });
            if (onProgress) onProgress(100);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }
  }

  public static async addSavedAddress(
    userId: string,
    address: { label: string; addressText: string; lat: number; lng: number }
  ): Promise<void> {
    const user = await FirebaseService.getDocument<PickPalUser>("users", userId);
    if (!user) return;
    const current = user.savedAddresses || [];
    const updated = [...current, { ...address, isDefault: current.length === 0 }];
    await this.updateProfile(userId, { savedAddresses: updated });
  }

  public static async deleteSavedAddress(userId: string, label: string): Promise<void> {
    const user = await FirebaseService.getDocument<PickPalUser>("users", userId);
    if (!user) return;
    const current = user.savedAddresses || [];
    const updated = current.filter((a: any) => a.label !== label);
    await this.updateProfile(userId, { savedAddresses: updated });
  }
}
