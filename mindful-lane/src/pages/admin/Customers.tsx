import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, RefreshCw, Mail, Calendar, ShoppingBag, DollarSign, X, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface Customer {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

const AdminCustomers = () => {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => api.get<{ success: boolean; data: Customer[] }>("/auth/users"),
  });

  const customers = data?.data || [];
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDA = (n: number) => `${n.toLocaleString("fr-DZ")} DA`;

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-[2px] flex items-center gap-2">
            <Users size={20} className="text-accent" /> CUSTOMERS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage registered buyers and view their engagement metrics</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 pl-9 pr-4 bg-background border border-border text-sm outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 border border-border hover:border-foreground transition-colors bg-background text-foreground cursor-pointer rounded-none"
          title="Refresh List"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Customers Table */}
      <div className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {["Customer Name", "Email Address", "Registered Date", "Orders Placed", "Total Expenditure", "Fulfillment"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-[1px] text-muted-foreground font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-secondary animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <motion.tr
                    key={customer._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center text-xs font-semibold select-none">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground select-all">{customer.email}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{new Date(customer.createdAt).toLocaleDateString("en-GB")}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={12} className="text-muted-foreground" />
                        <span className="font-light">{customer.orderCount}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-accent">
                      {formatDA(customer.totalSpent)}
                    </td>
                    <td className="px-5 py-3">
                      {customer.isVerified ? (
                        <span className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-1.5 py-0.5 uppercase tracking-[0.5px]">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 px-1.5 py-0.5 uppercase tracking-[0.5px]">
                          Unverified
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Quick View Side Panel / Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative w-full max-w-md h-full bg-card border-l border-border p-6 md:p-8 z-10 flex flex-col shadow-xl"
            >
              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none"
              >
                <X size={18} />
              </button>

              <div className="flex-1 overflow-y-auto space-y-6 pt-4">
                {/* Initials & Title */}
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <div className="w-14 h-14 bg-foreground text-background flex items-center justify-center text-xl font-bold">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-light uppercase tracking-[1px]">{selectedCustomer.name}</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-[1px] mt-0.5">Customer Profile</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-[1.5px] text-muted-foreground">Account Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Email Address</p>
                      <a
                        href={`mailto:${selectedCustomer.email}`}
                        className="text-accent hover:underline flex items-center gap-1 mt-0.5 select-all break-all"
                      >
                        <Mail size={12} /> {selectedCustomer.email}
                      </a>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Status</p>
                      <p className="mt-0.5">
                        {selectedCustomer.isVerified ? (
                          <span className="text-green-600 font-medium uppercase tracking-[0.5px] text-xs">Verified User</span>
                        ) : (
                          <span className="text-amber-600 font-medium uppercase tracking-[0.5px] text-xs">Unverified User</span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Registration Date</p>
                      <p className="mt-0.5 flex items-center gap-1">
                        <Calendar size={12} className="text-muted-foreground" />
                        <span>{new Date(selectedCustomer.createdAt).toLocaleDateString("en-GB")}</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-[0.5px]">Database ID</p>
                      <p className="font-mono text-[10px] bg-secondary border border-border px-1.5 py-0.5 select-all mt-0.5 text-muted-foreground break-all">
                        {selectedCustomer._id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Stats */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-xs uppercase tracking-[1.5px] text-muted-foreground">Lifetime Value (LTV)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-border p-4 bg-secondary/50">
                      <p className="text-[10px] uppercase tracking-[1px] text-muted-foreground flex items-center gap-1.5">
                        <ShoppingBag size={12} /> Orders
                      </p>
                      <p className="text-xl font-light mt-1 text-foreground">{selectedCustomer.orderCount}</p>
                    </div>
                    <div className="border border-border p-4 bg-secondary/50">
                      <p className="text-[10px] uppercase tracking-[1px] text-muted-foreground flex items-center gap-1.5">
                        <DollarSign size={12} /> Total Spent
                      </p>
                      <p className="text-base font-semibold mt-1 text-accent break-words">{formatDA(selectedCustomer.totalSpent)}</p>
                    </div>
                  </div>
                </div>

                {/* Security flag notice */}
                <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex gap-3 text-xs">
                  <ShieldAlert size={16} className="text-amber-600 flex-shrink-0" />
                  <div className="space-y-1 text-amber-800 dark:text-amber-400">
                    <p className="font-semibold uppercase tracking-[0.5px]">Policy Compliance</p>
                    <p className="font-light leading-relaxed">
                      All personal buyer records comply with security principles. Keep customer contact records confidential.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-5 py-2.5 bg-foreground text-background text-xs uppercase tracking-[1.5px] hover:bg-accent border-none cursor-pointer transition-colors rounded-none font-light w-full"
                >
                  Close panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCustomers;
