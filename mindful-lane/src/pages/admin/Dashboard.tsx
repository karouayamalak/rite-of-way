import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  Users, DollarSign, Clock, ChevronRight, AlertTriangle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import { api } from "@/lib/api";

interface DashboardStats {
  totalRevenue: number;
  monthRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  todayOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  recentOrders: {
    _id: string; orderNumber: string; total: number; status: string;
    createdAt: string; customer?: { name: string; email: string };
    shipping: { firstName: string; lastName: string };
  }[];
}

interface RevenueDay { date: string; revenue: number; orders: number; }
interface TopProduct { _id: string; totalSold: number; revenue: number; }

const statusColors: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50 dark:bg-amber-950",
  confirmed: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  processing: "text-purple-600 bg-purple-50",
  shipped: "text-indigo-600 bg-indigo-50",
  delivered: "text-green-600 bg-green-50 dark:bg-green-950",
  cancelled: "text-red-600 bg-red-50 dark:bg-red-950",
};

const StatCard = ({
  title, value, sub, icon: Icon, growth, color = "foreground"
}: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; growth?: number; color?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border p-6"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 flex items-center justify-center bg-secondary`}>
        <Icon size={18} className={`text-${color}`} />
      </div>
      {growth !== undefined && (
        <span className={`inline-flex items-center gap-1 text-xs ${growth >= 0 ? "text-green-600" : "text-red-600"}`}>
          {growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(growth)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-light mb-1">{value}</p>
    <p className="text-xs uppercase tracking-[1px] text-muted-foreground">{title}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </motion.div>
);

interface DashboardProduct {
  _id: string;
  title: string;
  stock: number;
  category: string;
}

const AdminDashboard = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get<{ success: boolean; data: DashboardStats }>("/admin/analytics/dashboard"),
    refetchInterval: 60_000,
  });

  const { data: chartData } = useQuery({
    queryKey: ["revenue-chart"],
    queryFn: () => api.get<{ success: boolean; data: RevenueDay[] }>("/admin/analytics/revenue-chart"),
  });

  const { data: topData } = useQuery({
    queryKey: ["top-products"],
    queryFn: () => api.get<{ success: boolean; data: TopProduct[] }>("/admin/analytics/top-products"),
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin-products-low-stock"],
    queryFn: () => api.get<{ success: boolean; data: DashboardProduct[] }>("/products?stockLessThan=5&limit=10"),
  });

  const { data: activityData } = useQuery({
    queryKey: ["admin-recent-activities"],
    queryFn: () => api.get<{ success: boolean; data: any[] }>("/admin/activity-logs?page=1&limit=6"),
  });

  const stats = statsData?.data;
  const chart = chartData?.data || [];
  const topProducts = topData?.data || [];
  const lowStockProducts = productsData?.data || [];
  const recentActivities = activityData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-28 bg-secondary animate-pulse" />)}
        </div>
        <div className="h-64 bg-secondary animate-pulse" />
      </div>
    );
  }

  const formatDA = (n: number) => `${n.toLocaleString("fr-DZ")} DA`;

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-light tracking-[2px]">DASHBOARD</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, overview of your store</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue" icon={DollarSign}
          value={formatDA(stats?.totalRevenue || 0)}
          sub={`${formatDA(stats?.monthRevenue || 0)} this month`}
          growth={stats?.revenueGrowth}
        />
        <StatCard
          title="Total Orders" icon={ShoppingCart}
          value={String(stats?.totalOrders || 0)}
          sub={`${stats?.todayOrders || 0} today`}
        />
        <StatCard
          title="Products" icon={Package}
          value={String(stats?.totalProducts || 0)}
        />
        <StatCard
          title="Customers" icon={Users}
          value={String(stats?.totalCustomers || 0)}
        />
      </div>

      {/* Pending alert */}
      {(stats?.pendingOrders || 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-between border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-5 py-3">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-amber-600" />
            <span className="text-sm">
              <strong>{stats?.pendingOrders}</strong> pending order{(stats?.pendingOrders || 0) !== 1 ? "s" : ""} need your attention
            </span>
          </div>
          <Link to="/admin/orders?status=pending" className="text-xs uppercase tracking-[1px] text-amber-600 hover:text-amber-800 no-underline">
            View All <ChevronRight size={12} className="inline" />
          </Link>
        </motion.div>
      )}

      {/* Low Stock alert */}
      {lowStockProducts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-400">
              Low Stock Alerts ({lowStockProducts.length} item{lowStockProducts.length !== 1 ? "s" : ""})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div key={p._id} className="flex items-center justify-between bg-card border border-border p-3 text-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-medium truncate text-foreground">{p.title}</p>
                  <p className="text-muted-foreground mt-0.5 uppercase tracking-[0.5px] text-[10px]">{p.category}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 font-semibold ${p.stock === 0 ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"}`}>
                    {p.stock === 0 ? "OUT OF STOCK" : `${p.stock} LEFT`}
                  </span>
                  <Link to={`/admin/products/${p._id}/edit`} className="text-accent hover:underline uppercase tracking-[0.5px] font-medium font-sans">
                    Restock
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Revenue chart + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 border border-border p-6">
          <h2 className="text-sm uppercase tracking-[1px] mb-6">Revenue — Last 30 Days</h2>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(18 17% 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(18 17% 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)}
                  stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                  formatter={(v: number) => [`${v.toLocaleString("fr-DZ")} DA`, "Revenue"]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(18 17% 48%)" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No revenue data yet</div>
          )}
        </div>

        {/* Top products */}
        <div className="border border-border p-6">
          <h2 className="text-sm uppercase tracking-[1px] mb-6">Top Products</h2>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="_id" width={90} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 11 }}
                  formatter={(v: number) => [v, "Sold"]}
                />
                <Bar dataKey="totalSold" fill="hsl(18 17% 48%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
          )}
        </div>
      </div>

      {/* Bottom section: Recent Orders + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 border border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-sm uppercase tracking-[1px]">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs uppercase tracking-[1px] text-muted-foreground hover:text-foreground no-underline transition-colors">
              View All <ChevronRight size={12} className="inline" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Order #", "Customer", "Total", "Status", "Date"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs uppercase tracking-[1px] text-muted-foreground font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.recentOrders || []).map((order) => (
                  <tr key={order._id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-3">
                      <Link to={`/admin/orders/${order._id}`} className="font-medium hover:text-accent no-underline transition-colors">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {order.customer?.name || `${order.shipping.firstName} ${order.shipping.lastName}`}
                    </td>
                    <td className="px-6 py-3">{order.total.toLocaleString("fr-DZ")} DA</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 text-xs uppercase tracking-[0.5px] ${statusColors[order.status] || "text-muted-foreground"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
                {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit trail feed */}
        <div className="border border-border bg-card flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-sm uppercase tracking-[1px]">Admin Activity</h2>
            <Link to="/admin/activity-logs" className="text-xs uppercase tracking-[1px] text-muted-foreground hover:text-foreground no-underline transition-colors">
              View All <ChevronRight size={12} className="inline" />
            </Link>
          </div>
          <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto font-sans flex-1">
            {recentActivities.map((log: any) => (
              <div key={log._id} className="text-xs border-b border-border/40 pb-3 last:border-none last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground">{log.adminName}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleDateString("en-GB")}</span>
                </div>
                <p className="text-muted-foreground leading-normal mt-0.5">{log.details}</p>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-muted-foreground text-center text-xs py-8">No admin activities logged yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
