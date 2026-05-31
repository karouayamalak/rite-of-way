import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DollarSign, ShoppingCart, Users, Package, BarChart3, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { api } from "@/lib/api";

interface RevenueDay {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  _id: string; // product title
  totalSold: number;
  revenue: number;
}

interface OrderStatusCount {
  _id: string; // status name
  count: number;
}

interface DashboardStats {
  totalRevenue: number;
  monthRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  todayOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

const statusColors: Record<string, string> = {
  pending: "#e67e22",
  confirmed: "#3498db",
  processing: "#9b59b6",
  shipped: "#2980b9",
  delivered: "#2ecc71",
  cancelled: "#e74c3c",
  refunded: "#95a5a6",
};

const StatCard = ({
  title, value, sub, icon: Icon, growth
}: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; growth?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border p-6"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 flex items-center justify-center bg-secondary">
        <Icon size={18} className="text-foreground" />
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

const AdminAnalytics = () => {
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get<{ success: boolean; data: DashboardStats }>("/admin/analytics/dashboard"),
  });

  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ["revenue-chart"],
    queryFn: () => api.get<{ success: boolean; data: RevenueDay[] }>("/admin/analytics/revenue-chart"),
  });

  const { data: topData, isLoading: isTopLoading } = useQuery({
    queryKey: ["top-products"],
    queryFn: () => api.get<{ success: boolean; data: TopProduct[] }>("/admin/analytics/top-products"),
  });

  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ["orders-by-status"],
    queryFn: () => api.get<{ success: boolean; data: OrderStatusCount[] }>("/admin/analytics/orders-by-status"),
  });

  const isLoading = isStatsLoading || isChartLoading || isTopLoading || isStatusLoading;

  const stats = statsData?.data;
  const chart = chartData?.data || [];
  const topProducts = topData?.data || [];
  const orderStatuses = statusData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-secondary animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-secondary animate-pulse" />
          <div className="h-80 bg-secondary animate-pulse" />
        </div>
      </div>
    );
  }

  const formatDA = (n: number) => `${n.toLocaleString("fr-DZ")} DA`;
  const aov = stats && stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;

  // Transform orderStatuses data for PieChart
  const pieData = orderStatuses.map((s) => ({
    name: s._id.toUpperCase(),
    value: s.count,
    color: statusColors[s._id] || "#7f8c8d",
  }));

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-light tracking-[2px] flex items-center gap-2">
          <BarChart3 size={20} className="text-accent" /> ANALYTICS & REPORTS
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Deep-dive performance insights and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earnings"
          icon={DollarSign}
          value={formatDA(stats?.totalRevenue || 0)}
          growth={stats?.revenueGrowth}
          sub={`${formatDA(stats?.monthRevenue || 0)} this month`}
        />
        <StatCard
          title="Average Order Value"
          icon={Package}
          value={formatDA(aov)}
          sub="Calculated from total sales"
        />
        <StatCard
          title="Total Orders"
          icon={ShoppingCart}
          value={String(stats?.totalOrders || 0)}
          sub={`${stats?.todayOrders || 0} placed today`}
        />
        <StatCard
          title="Customers base"
          icon={Users}
          value={String(stats?.totalCustomers || 0)}
          sub="Registered buyers"
        />
      </div>

      {/* Primary Revenue and Order charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue over time (30 days) */}
        <div className="lg:col-span-2 border border-border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-sm uppercase tracking-[1.5px]">Revenue Growth</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Sales trajectory over the last 30 active days</p>
          </div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="analyticsRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(18 17% 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(18 17% 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                  formatter={(v: number) => [`${v.toLocaleString("fr-DZ")} DA`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(18 17% 48%)" fill="url(#analyticsRevenueGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm uppercase tracking-[1px]">
              No sales logs available
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="border border-border bg-card p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-sm uppercase tracking-[1.5px]">Orders Distribution</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown of orders by fulfillment stage</p>
          </div>
          {pieData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 11 }}
                    formatter={(v: number) => [v, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 w-full text-xs">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="truncate text-muted-foreground uppercase font-light tracking-[0.5px]">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm uppercase tracking-[1px] m-auto">
              No distribution data
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Top Products and Orders activity volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products detailed list */}
        <div className="border border-border bg-card p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-sm uppercase tracking-[1.5px]">Top Selling Items</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Highest volume and value generators</p>
            </div>
            <ArrowUpRight size={16} className="text-muted-foreground" />
          </div>
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-[1px] text-muted-foreground">
                    <th className="py-2.5 font-normal">Product / Style</th>
                    <th className="py-2.5 text-right font-normal">Items Sold</th>
                    <th className="py-2.5 text-right font-normal">Gross Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3 font-medium text-foreground truncate max-w-[200px]">{p._id}</td>
                      <td className="py-3 text-right font-light">{p.totalSold}</td>
                      <td className="py-3 text-right font-medium text-accent">{p.revenue.toLocaleString("fr-DZ")} DA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm uppercase tracking-[1px]">
              No product analytics recorded
            </div>
          )}
        </div>

        {/* Order volume curve (orders count per day) */}
        <div className="border border-border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-sm uppercase tracking-[1.5px]">Daily Checkout Volume</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Number of orders finalized daily</p>
          </div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(8)} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                  formatter={(v: number) => [v, "Orders"]}
                />
                <Bar dataKey="orders" fill="hsl(var(--foreground))" barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm uppercase tracking-[1px]">
              No checkout logs
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
