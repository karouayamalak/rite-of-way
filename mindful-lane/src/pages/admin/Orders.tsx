import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Eye, Phone } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

interface Order {
  _id: string; orderNumber: string; total: number; status: string;
  createdAt: string;
  shipping: { firstName: string; lastName: string; wilaya: string; phone?: string };
  customer?: { name: string; email: string };
  items: { title: string; quantity: number }[];
}

const statusColors: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50", confirmed: "text-blue-600 bg-blue-50",
  processing: "text-purple-600 bg-purple-50", shipped: "text-indigo-600 bg-indigo-50",
  delivered: "text-green-600 bg-green-50", cancelled: "text-red-600 bg-red-50",
};

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

const AdminOrders = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", status, search, page],
    queryFn: () => api.get<{ success: boolean; data: Order[]; pagination: { total: number; pages: number } }>(
      `/orders?page=${page}&limit=15${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`
    ),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      api.put(`/orders/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err) => { if (err instanceof ApiError) toast.error(err.message); },
  });

  const orders = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-[2px]">ORDERS</h1>
          <p className="text-sm text-muted-foreground mt-1">{pagination?.total || 0} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search by order number..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 pl-9 pr-4 bg-background border border-border text-sm outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="py-2.5 px-3 bg-background border border-border text-sm outline-none focus:border-foreground text-foreground cursor-pointer">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {["Order #", "Customer", "Items", "Total", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-[1px] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-3"><div className="h-4 bg-secondary animate-pulse rounded" /></td>)}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No orders found</td></tr>
              ) : (
                orders.map((order) => (
                  <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium">#{order.orderNumber}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm">{order.customer?.name || `${order.shipping.firstName} ${order.shipping.lastName}`}</p>
                      <p className="text-xs text-muted-foreground">{order.shipping.wilaya}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {order.items?.slice(0, 1).map((it) => `${it.title} ×${it.quantity}`).join("")}
                      {(order.items?.length || 0) > 1 && ` +${(order.items?.length || 0) - 1} more`}
                    </td>
                    <td className="px-5 py-3">{order.total.toLocaleString("fr-DZ")} DA</td>
                    <td className="px-5 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => statusMutation.mutate({ id: order._id, newStatus: e.target.value })}
                        className={`text-xs px-2 py-1 border-none outline-none cursor-pointer uppercase tracking-[0.5px] rounded-none ${statusColors[order.status] || ""}`}
                      >
                        {ORDER_STATUSES.map((s) => <option key={s} value={s} className="text-foreground bg-background">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {order.shipping.phone && (
                          <>
                            <a
                              href={`tel:${order.shipping.phone}`}
                              title={`Call ${order.shipping.phone}`}
                              className="p-1.5 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                            >
                              <Phone size={14} />
                            </a>
                            <a
                              href={`https://wa.me/${order.shipping.phone.replace(/^0/, '213')}?text=${encodeURIComponent(`Bonjour ${order.shipping.firstName}, nous confirmons votre commande #${order.orderNumber} sur Rite of Way. Total: ${order.total.toLocaleString('fr-DZ')} DA (Cash à la livraison). Merci!`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Confirm via WhatsApp"
                              className="p-1.5 hover:bg-[#25D366]/10 transition-colors text-[#25D366] inline-flex items-center justify-center"
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.33 4.982L2 22l5.209-1.365a9.994 9.994 0 0 0 4.8 1.233h.005c5.507 0 9.99-4.478 9.99-9.985a9.984 9.984 0 0 0-9.99-9.983zm0 18.294h-.003a8.275 8.275 0 0 1-4.218-1.155l-.303-.18-3.13.82.836-3.05-.198-.313a8.278 8.278 0 0 1-1.268-4.46c.001-4.57 3.72-8.286 8.286-8.286a8.26 8.26 0 0 1 5.856 2.428 8.26 8.26 0 0 1 2.426 5.86c-.001 4.572-3.72 8.287-8.286 8.287zm4.542-6.208c-.249-.125-1.472-.727-1.7-.81-.228-.083-.393-.125-.558.125-.165.25-.638.81-.782.975-.145.165-.29.185-.539.06a6.79 6.79 0 0 1-2.002-1.234 7.483 7.483 0 0 1-1.385-1.724c-.145-.25-.015-.385.11-.51.113-.113.25-.29.375-.436.125-.145.166-.25.25-.416.083-.167.042-.313-.02-.438-.063-.125-.558-1.344-.763-1.84-.2-.48-.42-.416-.558-.422-.145-.007-.31-.007-.475-.007a.913.913 0 0 0-.663.31c-.228.25-.87.85-.87 2.075 0 1.225.89 2.413.99 2.553.1.14 1.753 2.678 4.248 3.755.593.257 1.058.41 1.418.524.596.19 1.138.163 1.567.099.478-.073 1.472-.602 1.679-1.185.207-.583.207-1.082.145-1.185-.062-.104-.228-.166-.477-.29z"/></svg>
                            </a>
                          </>
                        )}
                        <Link to={`/admin/orders/${order._id}`} className="p-1.5 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground inline-block">
                          <Eye size={14} />
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 text-sm border transition-colors ${p === page ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
