import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Printer, ShoppingBag, User, MapPin, CreditCard, Calendar, Clock, Phone, Mail } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    title: string;
    slug: string;
    images?: string[];
  };
  title: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer?: {
    name: string;
    email: string;
  };
  items: OrderItem[];
  shipping: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address: string;
    wilaya: string;
    cost: number;
    deliveryType?: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
  };
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
  confirmed: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50",
  processing: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50",
  shipped: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50",
  delivered: "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800/50",
  cancelled: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800/50",
  refunded: "text-gray-600 bg-gray-50 dark:bg-gray-950/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800/50",
};

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => api.get<{ success: boolean; data: Order }>(`/orders/${id}`),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      api.put<{ success: boolean }>(`/orders/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      toast.success("Order status updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update status");
      }
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (newStatus: string) =>
      api.put<{ success: boolean }>(`/orders/${id}/status`, { paymentStatus: newStatus }),
    onSuccess: () => {
      toast.success("Payment status updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update payment status");
      }
    },
  });

  const order = data?.data;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-secondary animate-pulse w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-secondary animate-pulse" />
            <div className="h-48 bg-secondary animate-pulse" />
          </div>
          <div className="h-96 bg-secondary animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12 border border-border">
        <p className="text-muted-foreground text-sm uppercase tracking-[1px] mb-4">
          {error instanceof Error ? error.message : "Order not found"}
        </p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[1px] bg-foreground text-background px-4 py-2 hover:bg-accent transition-colors no-underline"
        >
          <ArrowLeft size={12} /> Back to Orders
        </Link>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-8 print:p-0">
      {/* Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 print:hidden">
        <div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[1px] text-muted-foreground hover:text-foreground no-underline transition-colors mb-3"
          >
            <ArrowLeft size={12} /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light tracking-[2px]">ORDER #{order.orderNumber}</h1>
            <span className={`px-2.5 py-0.5 text-xs uppercase tracking-[0.5px] font-medium ${statusColors[order.status] || ""}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-[1px] mt-1 flex items-center gap-1.5">
            <Calendar size={12} /> Place Date: {new Date(order.createdAt).toLocaleString("en-GB")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-xs uppercase tracking-[1px] hover:border-foreground transition-colors bg-background text-foreground cursor-pointer rounded-none font-light"
          >
            <Printer size={14} /> Print Receipt
          </button>
          <select
            value={order.status}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            disabled={statusMutation.isPending}
            className="py-2.5 px-3 bg-foreground text-background border-none text-xs uppercase tracking-[1.5px] cursor-pointer hover:bg-accent transition-colors outline-none rounded-none"
          >
            {ORDER_STATUSES.map((statusOption) => (
              <option key={statusOption} value={statusOption} className="text-foreground bg-background uppercase tracking-[1px]">
                Mark as {statusOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
           PRINT ONLY — PROFESSIONAL ALGERIAN BORDEREAU / SHIPPING LABEL
           ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden print:block">
        {/* Cut line */}
        <div style={{ borderTop: "2px dashed #999", marginBottom: "8px", fontSize: "9px", color: "#999", textAlign: "center", paddingTop: "4px" }}>
          ✂ ─────────────────── COUPER ICI / CUT HERE ───────────────────── ✂
        </div>

        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "100%", padding: "12px 16px", border: "2px solid #000" }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "4px", textTransform: "uppercase" }}>RITE OF WAY</div>
              <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1px", marginTop: "2px" }}>BORDEREAU D'EXPÉDITION</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#888" }}>N° Commande</div>
              <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "1px" }}>#{order.orderNumber}</div>
              <div style={{ fontSize: "10px", color: "#666" }}>{new Date(order.createdAt).toLocaleString("fr-DZ")}</div>
            </div>
          </div>

          {/* Destination — large and bold for couriers */}
          <div style={{ backgroundColor: "#f5f5f5", border: "1px solid #ddd", padding: "10px 14px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>📦 DESTINATAIRE / RECIPIENT</div>
              <div style={{ fontSize: "11px", fontWeight: 800, padding: "2px 6px", backgroundColor: "#000", color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>
                {order.shipping.deliveryType === "stopdesk" ? "🏪 STOP DESK" : "🏠 DOMICILE"}
              </div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>{order.shipping.firstName} {order.shipping.lastName}</div>
            <div style={{ fontSize: "13px", marginTop: "4px" }}>{order.shipping.address}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "6px", textTransform: "uppercase", letterSpacing: "1px", color: "#222" }}>
              WILAYA: {order.shipping.wilaya}
            </div>
            {/* Extra large phone for quick scanning */}
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#666" }}>📞 TEL:</span>
              <span style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "2px", color: "#000" }}>{order.shipping.phone}</span>
            </div>
          </div>

          {/* Items checklist */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
              ARTICLES COMMANDÉS
            </div>
            {order.items.map((item, idx) => (
              <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px dashed #eee", fontSize: "11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ border: "1px solid #999", width: "14px", height: "14px", display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{item.title}</span>
                  {item.size && <span style={{ color: "#666" }}>({item.size})</span>}
                  {item.color && <span style={{ color: "#666" }}>{item.color}</span>}
                </div>
                <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
                  <span style={{ color: "#555" }}>×{item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString("fr-DZ")} DA</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ borderTop: "2px solid #000", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "10px", color: "#666" }}>
              <div>Livraison ({order.shipping.wilaya}): {order.shippingCost?.toLocaleString("fr-DZ") ?? "—"} DA</div>
              <div style={{ color: "#c00", fontWeight: 600, marginTop: "2px" }}>Paiement: CASH À LA LIVRAISON (COD)</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "#888" }}>TOTAL À ENCAISSER</div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#000", letterSpacing: "1px" }}>{order.total.toLocaleString("fr-DZ")} DA</div>
            </div>
          </div>
        </div>

        {/* Bottom cut line */}
        <div style={{ borderTop: "2px dashed #999", marginTop: "8px", fontSize: "9px", color: "#999", textAlign: "center", paddingTop: "4px" }}>
          ✂ ─────────────────── COUPER ICI / CUT HERE ───────────────────── ✂
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: items, payment info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="border border-border bg-card">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <ShoppingBag size={16} className="text-muted-foreground" />
              <h2 className="text-sm uppercase tracking-[1.5px]">Order Items</h2>
              <span className="ml-auto text-xs text-muted-foreground">{order.items.length} {order.items.length === 1 ? "item" : "items"}</span>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item._id} className="p-6 flex gap-4">
                  <div className="w-16 h-20 bg-secondary flex-shrink-0 border border-border">
                    {item.product?.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate hover:text-accent transition-colors">
                      {item.product?.slug ? (
                        <Link to={`/product/${item.product.slug}`} className="no-underline text-foreground">
                          {item.title}
                        </Link>
                      ) : (
                        item.title
                      )}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      {item.size && (
                        <span>
                          SIZE: <span className="text-foreground uppercase font-medium">{item.size}</span>
                        </span>
                      )}
                      {item.color && (
                        <span>
                          COLOR: <span className="text-foreground uppercase font-medium">{item.color}</span>
                        </span>
                      )}
                      <span>
                        QTY: <span className="text-foreground font-medium">×{item.quantity}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.price.toLocaleString("fr-DZ")} DA</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Subtotal: {(item.price * item.quantity).toLocaleString("fr-DZ")} DA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Cost summary */}
          <div className="border border-border bg-card p-6">
            <h3 className="text-sm uppercase tracking-[1.5px] mb-4">Cost Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString("fr-DZ")} DA</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping ({order.shipping.wilaya})</span>
                <span>{(order.shipping.cost || order.shippingCost || 0).toLocaleString("fr-DZ")} DA</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-medium text-base">
                <span className="uppercase tracking-[1px]">Total</span>
                <span className="text-accent">{order.total.toLocaleString("fr-DZ")} DA</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-muted-foreground" />
                <h3 className="text-sm uppercase tracking-[1.5px]">Payment Status</h3>
              </div>
              <span className={`px-2 py-0.5 text-xs uppercase tracking-[0.5px] ${
                order.payment.status === "paid"
                  ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
              }`}>
                {order.payment.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Payment Method</p>
                <p className="font-light uppercase tracking-[0.5px]">
                  {order.payment.method === "stripe" ? "Stripe Credit Card" : "Cash On Delivery (COD)"}
                </p>
              </div>
              {order.payment.transactionId && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Transaction ID</p>
                  <p className="font-mono text-xs break-all bg-secondary px-2 py-1 select-all border border-border">
                    {order.payment.transactionId}
                  </p>
                </div>
              )}
              <div className="sm:col-span-2 space-y-2 pt-2 border-t border-border/50 print:hidden">
                <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Update Payment Status</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => paymentMutation.mutate("unpaid")}
                    disabled={paymentMutation.isPending || order.payment.status === "unpaid"}
                    className={`px-3 py-1.5 text-xs uppercase tracking-[0.5px] border cursor-pointer font-light transition-all rounded-none ${
                      order.payment.status === "unpaid"
                        ? "bg-secondary text-muted-foreground border-border cursor-not-allowed"
                        : "border-border hover:border-foreground bg-background text-foreground"
                    }`}
                  >
                    Mark Unpaid
                  </button>
                  <button
                    onClick={() => paymentMutation.mutate("paid")}
                    disabled={paymentMutation.isPending || order.payment.status === "paid"}
                    className={`px-3 py-1.5 text-xs uppercase tracking-[0.5px] border cursor-pointer font-light transition-all rounded-none ${
                      order.payment.status === "paid"
                        ? "bg-secondary text-muted-foreground border-border cursor-not-allowed"
                        : "border-accent text-accent hover:bg-accent hover:text-background"
                    }`}
                  >
                    Mark Paid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: customer, shipping info */}
        <div className="space-y-6">
          {/* Customer Profile */}
          <div className="border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <User size={16} className="text-muted-foreground" />
              <h3 className="text-sm uppercase tracking-[1.5px]">Customer Profile</h3>
            </div>
            {order.customer ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Account Name</p>
                  <p className="text-sm font-medium mt-0.5">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Account Email</p>
                  <a href={`mailto:${order.customer.email}`} className="text-sm text-accent hover:underline flex items-center gap-1.5 mt-0.5 break-all print:no-underline print:text-foreground">
                    <Mail size={12} /> {order.customer.email}
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Checkout Type</p>
                <p className="text-sm font-light uppercase tracking-[0.5px] mt-0.5">Guest Customer</p>
              </div>
            )}
          </div>

          {/* Shipping / Delivery */}
          <div className="border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <MapPin size={16} className="text-muted-foreground" />
              <h3 className="text-sm uppercase tracking-[1.5px]">Delivery Details</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Recipient</p>
                <p className="font-medium mt-0.5">{order.shipping.firstName} {order.shipping.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Phone Number</p>
                <a href={`tel:${order.shipping.phone}`} className="text-accent hover:underline flex items-center gap-1.5 mt-0.5 print:no-underline print:text-foreground">
                  <Phone size={12} /> {order.shipping.phone}
                </a>
              </div>
              {order.shipping.email && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Contact Email</p>
                  <a href={`mailto:${order.shipping.email}`} className="text-accent hover:underline flex items-center gap-1.5 mt-0.5 break-all print:no-underline print:text-foreground">
                    <Mail size={12} /> {order.shipping.email}
                  </a>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Address</p>
                <p className="font-light mt-0.5 leading-relaxed">{order.shipping.address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Wilaya / Province</p>
                <p className="font-medium mt-0.5 uppercase tracking-[0.5px]">{order.shipping.wilaya}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Delivery Method / Mode de Livraison</p>
                <p className="font-medium mt-0.5 uppercase tracking-[0.5px] flex items-center gap-1.5">
                  {order.shipping.deliveryType === "stopdesk" ? (
                    <>🏪 Stop Desk (Retrait au Bureau)</>
                  ) : (
                    <>🏠 Livraison à Domicile</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
