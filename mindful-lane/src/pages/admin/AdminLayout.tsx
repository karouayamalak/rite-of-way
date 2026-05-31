import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  Tag, Users, Menu, X, LogOut, ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get<{ success: boolean; data: any }>("/admin/analytics/dashboard"),
    refetchInterval: 30_000,
  });

  const pendingCount = statsData?.data?.pendingOrders || 0;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Sonner richColors position="top-right" />
      <div className="min-h-screen bg-background flex font-sans">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[1.1rem] font-light tracking-[2px] text-sidebar-foreground">RITE OF WAY</p>
                <p className="text-xs text-sidebar-foreground/50 uppercase tracking-[1px] mt-0.5">Admin Panel</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden bg-transparent border-none text-sidebar-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isOrders = item.label === "Orders";
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 text-sm uppercase tracking-[1px] transition-colors no-underline group ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={16} strokeWidth={1.5} />
                  <span>{item.label}</span>
                  {isOrders && pendingCount > 0 && (
                    <span className="ml-auto bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full select-none shrink-0 transition-all duration-300">
                      {pendingCount}
                    </span>
                  )}
                  {!isOrders && <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
                  {isOrders && pendingCount === 0 && <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
                </NavLink>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/50 uppercase tracking-[1px]">Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-xs uppercase tracking-[1px] text-sidebar-foreground/60 hover:text-destructive transition-colors bg-transparent border-none cursor-pointer py-1"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-foreground/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden bg-transparent border-none text-foreground cursor-pointer">
              <Menu size={20} />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[1px]">
              Admin Dashboard
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <a href="/" target="_blank" rel="noopener noreferrer"
                className="text-xs uppercase tracking-[1px] text-muted-foreground hover:text-foreground transition-colors no-underline">
                View Store ↗
              </a>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-5 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AdminLayout;
