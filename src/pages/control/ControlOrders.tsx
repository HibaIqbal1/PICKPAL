import React, { useState } from "react";
import {
  ShoppingBag,
  Search,
  User,
  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Filter,
  DollarSign,
} from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAllOrders } from "../../hooks/useOrders";
import { Order, OrderStatus } from "../../types";

const STATUS_BADGE_STYLE: Record<string, string> = {
  searching_worker: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  worker_assigned: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  travelling: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  arrived: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  in_progress: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  checkout_approvals: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  delivering: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-slate-700 text-slate-400 border-slate-600",
};

export default function ControlOrders() {
  const { orders, loading } = useAllOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (o.id || "").toLowerCase().includes(query) ||
      (o.customerName || "").toLowerCase().includes(query) ||
      (o.workerName || "").toLowerCase().includes(query) ||
      (o.storeName || "").toLowerCase().includes(query) ||
      (o.category || "").toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        return o.status !== "completed" && o.status !== "cancelled";
      }
      return o.status === statusFilter;
    }

    return true;
  });

  return (
    <ControlLayout
      title="Orders & Dispatch Control"
      subtitle="Monitor customer order requests, assigned workers, delivery status, and order details"
    >
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, customer, worker, store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          {[
            { id: "all", label: "All Orders" },
            { id: "active", label: "Active Jobs" },
            { id: "searching_worker", label: "Searching Worker" },
            { id: "worker_assigned", label: "Assigned" },
            { id: "in_progress", label: "In Progress" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List View */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading order records...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
          <ShoppingBag size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No orders found</h3>
          <p className="text-xs text-slate-400">No order documents match your active status or search query.</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Order ID</th>
                  <th className="py-3.5 px-4 font-extrabold">Customer</th>
                  <th className="py-3.5 px-4 font-extrabold">Store / Service</th>
                  <th className="py-3.5 px-4 font-extrabold">Assigned Worker</th>
                  <th className="py-3.5 px-4 font-extrabold">Status</th>
                  <th className="py-3.5 px-4 font-extrabold">Amount</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-semibold">
                      #{order.id.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-white">
                      {order.customerName || "Customer"}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {order.storeName}
                      <span className="block text-[10px] text-slate-500 capitalize">{order.category}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {order.workerName ? (
                        <span className="text-emerald-300 font-bold">{order.workerName}</span>
                      ) : (
                        <span className="text-amber-400 font-medium italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          STATUS_BADGE_STYLE[order.status] || "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-400 font-mono">
                      ₹{order.totalAmount}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        Details <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Order Details</h3>
                <p className="text-xs font-mono text-slate-400">ID: {selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Order Status:</span>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    STATUS_BADGE_STYLE[selectedOrder.status] || "bg-slate-700 text-slate-300"
                  }`}
                >
                  {selectedOrder.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 font-medium">Customer:</span>
                  <p className="font-extrabold text-white mt-0.5">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Assigned Worker:</span>
                  <p className="font-extrabold text-emerald-400 mt-0.5">
                    {selectedOrder.workerName || "Unassigned"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Store / Service:</span>
                  <p className="font-bold text-white mt-0.5">{selectedOrder.storeName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Category:</span>
                  <p className="font-bold text-slate-300 uppercase mt-0.5">{selectedOrder.category}</p>
                </div>
              </div>

              {/* Items requested */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-500 font-medium">Requested Items:</span>
                  <ul className="space-y-1">
                    {selectedOrder.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-white font-medium">
                        <span>{item.name} x {item.qty}</span>
                        {item.price && <span className="font-mono">₹{item.price}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Financial summary */}
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Budget Cap:</span>
                  <span className="font-mono text-slate-200">₹{selectedOrder.budgetCap}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Status:</span>
                  <span className="font-bold text-emerald-400 uppercase">
                    {selectedOrder.paymentStatus || "Paid"}
                  </span>
                </div>
                <div className="flex justify-between text-white font-extrabold pt-2 border-t border-slate-700/60 text-sm">
                  <span>Total Amount:</span>
                  <span className="text-emerald-400 font-mono">₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ControlLayout>
  );
}
