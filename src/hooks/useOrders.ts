import { useEffect, useState } from "react";
import { Order } from "../types";
import { BookingService } from "../services/booking.service";

export function useCustomerOrders(customerId?: string, _customerName?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }
    const unsub = BookingService.subscribeCustomerBookings(customerId, (items) => {
      setOrders(items);
      setLoading(false);
    });
    return () => unsub();
  }, [customerId]);

  return { orders, loading };
}

export function useWorkerJobs(workerId?: string) {
  const [jobs, setJobs] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workerId) {
      setLoading(false);
      return;
    }
    const unsub = BookingService.subscribeWorkerJobs(workerId, (items) => {
      setJobs(items);
      setLoading(false);
    });
    return () => unsub();
  }, [workerId]);

  return { jobs, loading };
}

export function useWorkerOrders(workerId?: string) {
  const { jobs, loading } = useWorkerJobs(workerId);
  const [openJobs, setOpenJobs] = useState<Order[]>([]);

  useEffect(() => {
    const unsub = BookingService.subscribeAllBookings((all) => {
      setOpenJobs(all.filter((o) => o.status === "searching_worker"));
    });
    return () => unsub();
  }, []);

  return { open: openJobs, mine: jobs, loading };
}

export function useAllOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = BookingService.subscribeAllBookings((items) => {
      setOrders(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { orders, loading };
}

export function createOrder(orderData: Omit<Order, "id">) {
  return BookingService.createBooking(orderData).then((o) => o.id);
}
