import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

interface OrderItem { title: string; quantity: number; price: number; size?: string; image: string; }
interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
  shipping: { wilaya: string };
}

const statusColors: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50",
  confirmed: "text-blue-600 bg-blue-50",
  processing: "text-purple-600 bg-purple-50",
  shipped: "text-indigo-600 bg-indigo-50",
  delivered: "text-green-600 bg-green-50",
  cancelled: "text-red-600 bg-red-50",
  refunded: "text-gray-600 bg-gray-50",
};

const MyOrders = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.get<{ success: boolean; data: Order[] }>("/orders/my-orders"),
  });

  const orders = data?.data || [];

  return (
    <main className="pt-20 min-h-screen">
      <section className="bg-secondary py-16 px-5 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-light tracking-[3px] mb-2">MY ORDERS</motion.h1>
        <p className="text-muted-foreground">Track your order history</p>
      </section>

      <section className="max-w-[900px] mx-auto px-5 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-secondary animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Package size={64} strokeWidth={1} className="mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-light tracking-[2px] mb-4">NO ORDERS YET</h2>
            <p className="text-muted-foreground mb-8">Your order history will appear here.</p>
            <Link to="/shop" className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors no-underline">
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border border-border p-6 hover:border-foreground transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium tracking-[1px]">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-xs uppercase tracking-[1px] ${statusColors[order.status] || "text-muted-foreground bg-secondary"}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-medium">{order.total.toLocaleString("fr-DZ")} DA</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-foreground">{item.title}</span>
                      {item.size && <span className="text-xs">({item.size})</span>}
                      <span>× {item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Delivery to: {order.shipping?.wilaya}</p>
                  <Link to={`/my-orders/${order._id}`} className="inline-flex items-center gap-1 text-xs uppercase tracking-[1px] text-muted-foreground hover:text-foreground transition-colors no-underline">
                    Details <ChevronRight size={12} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MyOrders;
