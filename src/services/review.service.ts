import { ServiceReview } from "../types";
import { FirebaseService } from "./firebase.service";
import { where, Unsubscribe } from "firebase/firestore";

export class ReviewService {
  public static async submitReview(reviewData: Omit<ServiceReview, "id" | "createdAt">): Promise<void> {
    const id = "rev_" + Math.random().toString(36).substring(2, 10);
    const review: ServiceReview = {
      ...reviewData,
      id,
      createdAt: new Date().toISOString(),
    };
    await FirebaseService.setDocument("reviews", id, review);

    // Update worker average rating if workerId exists
    if (reviewData.workerId) {
      const reviews = await FirebaseService.queryCollection<ServiceReview>(
        "reviews",
        where("workerId", "==", reviewData.workerId)
      );
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = parseFloat((sum / reviews.length).toFixed(1));
        await FirebaseService.updateDocument("users", reviewData.workerId, { rating: avg });
      }
    }
  }

  public static subscribeWorkerReviews(workerId: string, onUpdate: (reviews: ServiceReview[]) => void): Unsubscribe {
    return FirebaseService.subscribeQuery<ServiceReview>(
      "reviews",
      [where("workerId", "==", workerId)],
      onUpdate
    );
  }
}
