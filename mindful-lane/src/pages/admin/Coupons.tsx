import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, Tag, Percent, DollarSign, Calendar, RefreshCw, X, ToggleLeft, ToggleRight, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

interface Coupon {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

const AdminCoupons = () => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const qc = useQueryClient();

  // Form states
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  const [maxUses, setMaxUses] = useState(100);
  const [expiresAt, setExpiresAt] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get<{ success: boolean; data: Coupon[] }>("/coupons"),
  });

  const createMutation = useMutation({
    mutationFn: (body: Omit<Coupon, "_id" | "usedCount" | "createdAt" | "isActive">) =>
      api.post<{ success: boolean; data: Coupon }>("/coupons", body),
    onSuccess: (res) => {
      toast.success(res.data ? "Coupon created successfully" : "Coupon created");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      closeModal();
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to create coupon");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Coupon> }) =>
      api.put<{ success: boolean; data: Coupon }>(`/coupons/${id}`, body),
    onSuccess: () => {
      toast.success("Coupon updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      closeModal();
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to update coupon");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/coupons/${id}`),
    onSuccess: () => {
      toast.success("Coupon deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to delete coupon");
    },
  });

  const coupons = data?.data || [];
  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setType("percent");
    setValue(0);
    setMinOrder(0);
    setMaxUses(100);
    setExpiresAt("");
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(coupon.value);
    setMinOrder(coupon.minOrderAmount);
    setMaxUses(coupon.maxUses);
    setExpiresAt(coupon.expiresAt ? coupon.expiresAt.substring(0, 10) : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    if (value <= 0) {
      toast.error("Value must be greater than zero");
      return;
    }

    const payload = {
      code: code.toUpperCase().replace(/\s+/g, ""),
      type,
      value,
      minOrderAmount: minOrder,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon._id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleStatus = (coupon: Coupon) => {
    updateMutation.mutate({
      id: coupon._id,
      body: { isActive: !coupon.isActive },
    });
  };

  const formatDA = (n: number) => `${n.toLocaleString("fr-DZ")} DA`;

  return (
    <div className="space-y-6">
      {/* Top section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-[2px] flex items-center gap-2">
            <Tag size={20} className="text-accent" /> COUPONS & DISCOUNTS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage promotional campaign vouchers</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs uppercase tracking-[1.5px] font-light hover:bg-accent transition-colors border-none cursor-pointer rounded-none"
        >
          <Plus size={14} /> Add Coupon
        </button>
      </div>

      {/* Search & Refresh */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search coupon code..."
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

      {/* Coupons Table */}
      <div className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {["Coupon Code", "Discount Value", "Requirements", "Usage Ratio", "Expiration", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-[1px] text-muted-foreground font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-secondary animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    No active coupons found
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  const isUsedUp = coupon.usedCount >= coupon.maxUses;

                  return (
                    <motion.tr
                      key={coupon._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${
                        !coupon.isActive || isExpired || isUsedUp ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono bg-secondary border border-border px-2 py-1 select-all font-medium text-foreground tracking-[0.5px]">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 font-medium">
                          {coupon.type === "percent" ? (
                            <>
                              <Percent size={13} className="text-accent" />
                              <span>{coupon.value}% OFF</span>
                            </>
                          ) : (
                            <>
                              <DollarSign size={13} className="text-accent" />
                              <span>{formatDA(coupon.value)}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {coupon.minOrderAmount > 0 ? (
                          <span>Min Order: <strong className="text-foreground">{formatDA(coupon.minOrderAmount)}</strong></span>
                        ) : (
                          "None"
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-foreground"
                              style={{ width: `${Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)}%` }}
                            />
                          </div>
                          <span>
                            {coupon.usedCount} / {coupon.maxUses}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {coupon.expiresAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span className={isExpired ? "text-red-500 font-medium" : ""}>
                              {new Date(coupon.expiresAt).toLocaleDateString("en-GB")}
                            </span>
                          </div>
                        ) : (
                          "Eternal"
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleStatus(coupon)}
                          disabled={updateMutation.isPending}
                          className="bg-transparent border-none cursor-pointer p-0 text-muted-foreground hover:text-foreground transition-colors"
                          title={coupon.isActive ? "Deactivate" : "Activate"}
                        >
                          {coupon.isActive && !isExpired && !isUsedUp ? (
                            <div className="flex items-center gap-1 text-green-600 text-xs uppercase tracking-[0.5px]">
                              <Check size={12} /> Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-500 text-xs uppercase tracking-[0.5px]">
                              Inactive
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="text-xs uppercase tracking-[0.5px] hover:text-accent transition-colors bg-transparent border-none cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this coupon?")) deleteMutation.mutate(coupon._id);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors bg-transparent border-none cursor-pointer p-1"
                            title="Delete Coupon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create overlay Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card border border-border p-6 md:p-8 z-10 shadow-lg"
            >
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none"
              >
                <X size={18} />
              </button>

              <h2 className="text-base uppercase tracking-[2px] mb-6">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-1.5">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STREETWEAR15"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border text-sm outline-none focus:border-foreground uppercase font-mono transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Type */}
                  <div>
                    <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-1.5">Discount Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as "percent" | "fixed")}
                      className="w-full px-3 py-2 bg-background border border-border text-sm outline-none focus:border-foreground cursor-pointer transition-colors"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed DA</option>
                    </select>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-1.5">
                      {type === "percent" ? "Percentage Value (%)" : "DA Discount Value"}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={type === "percent" ? 100 : 100000}
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-background border border-border text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Min order */}
                  <div>
                    <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-1.5">Min Order (DA)</label>
                    <input
                      type="number"
                      min={0}
                      value={minOrder}
                      onChange={(e) => setMinOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-background border border-border text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>

                  {/* Max uses */}
                  <div>
                    <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-1.5">Max Global Uses</label>
                    <input
                      type="number"
                      min={1}
                      value={maxUses}
                      onChange={(e) => setMaxUses(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-background border border-border text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-1.5">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border text-sm outline-none focus:border-foreground transition-colors"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-border text-xs uppercase tracking-[1px] hover:border-foreground bg-background text-foreground transition-colors cursor-pointer rounded-none font-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-5 py-2.5 bg-foreground text-background text-xs uppercase tracking-[1.5px] hover:bg-accent border-none cursor-pointer transition-colors rounded-none font-light"
                  >
                    {editingCoupon ? "Save Changes" : "Create Coupon"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;
