import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Save, MapPin, Plus, Search, ChevronDown, ChevronUp, Home, Store, ToggleLeft, ToggleRight, Loader } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

interface StoreSettings {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  shippingFeeHome: number;
  shippingFeeStopdesk: number;
  freeShippingThreshold: number;
  promoBannerText: string;
  promoBannerActive: boolean;
}

interface DbWilaya {
  _id: string;
  code: string;
  name: string;
  homeShippingCost: number;
  stopdeskShippingCost: number;
  isActive: boolean;
}

const AdminSettings = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"store" | "shipping">("store");
  const [formData, setFormData] = useState<StoreSettings>({
    storeName: "",
    contactEmail: "",
    contactPhone: "",
    whatsappNumber: "",
    shippingFeeHome: 600,
    shippingFeeStopdesk: 350,
    freeShippingThreshold: 10000,
    promoBannerText: "",
    promoBannerActive: true,
  });

  // Wilaya state
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [editedWilayas, setEditedWilayas] = useState<Record<string, { homeShippingCost: number; stopdeskShippingCost: number; isActive: boolean }>>({});
  const [isSavingWilayas, setIsSavingWilayas] = useState(false);
  const [showAddWilaya, setShowAddWilaya] = useState(false);
  const [newWilaya, setNewWilaya] = useState({ code: "", name: "", homeShippingCost: 600, stopdeskShippingCost: 400 });
  const [isAddingWilaya, setIsAddingWilaya] = useState(false);
  const [expandedWilaya, setExpandedWilaya] = useState<string | null>(null);

  // ── Store settings ──────────────────────────────────────────────────────
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: () => api.get<{ success: boolean; data: StoreSettings }>("/settings"),
  });

  useEffect(() => {
    if (settingsData?.data) setFormData(settingsData.data);
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: (newSettings: StoreSettings) =>
      api.put<{ success: boolean; message: string }>("/admin/settings", newSettings),
    onSuccess: (res) => {
      toast.success(res.message || "Store settings updated");
      qc.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to update settings");
    },
  });

  // ── Wilaya rates ────────────────────────────────────────────────────────
  const { data: wilayaData, isLoading: wilayasLoading, refetch: refetchWilayas } = useQuery({
    queryKey: ["admin-wilayas"],
    queryFn: () => api.get<{ success: boolean; data: DbWilaya[] }>("/wilayas/admin/all"),
  });

  const wilayas = wilayaData?.data || [];

  // Initialise edits when wilayas load or refresh
  useEffect(() => {
    if (wilayas.length > 0) {
      const initial: typeof editedWilayas = {};
      wilayas.forEach(w => {
        initial[w._id] = {
          homeShippingCost: w.homeShippingCost,
          stopdeskShippingCost: w.stopdeskShippingCost,
          isActive: w.isActive,
        };
      });
      setEditedWilayas(initial);
    }
  }, [wilayas]);

  const filteredWilayas = wilayas.filter(w =>
    w.name.toLowerCase().includes(wilayaSearch.toLowerCase()) ||
    w.code.includes(wilayaSearch)
  );

  const handleWilayaChange = (id: string, field: string, value: number | boolean) => {
    setEditedWilayas(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSaveWilayas = async () => {
    setIsSavingWilayas(true);
    try {
      const bulkData = Object.entries(editedWilayas).map(([id, vals]) => ({
        _id: id,
        ...vals,
      }));
      await api.put("/wilayas/bulk", { wilayas: bulkData });
      toast.success("Shipping rates saved successfully!");
      qc.invalidateQueries({ queryKey: ["wilayas"] });
      qc.invalidateQueries({ queryKey: ["admin-wilayas"] });
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to save shipping rates");
    } finally {
      setIsSavingWilayas(false);
    }
  };

  const handleAddWilaya = async () => {
    if (!newWilaya.code.trim() || !newWilaya.name.trim()) {
      toast.error("Wilaya code and name are required");
      return;
    }
    setIsAddingWilaya(true);
    try {
      const res = await api.post<{ success: boolean; data: DbWilaya; message: string }>("/wilayas", newWilaya);
      toast.success(res.message);
      setShowAddWilaya(false);
      setNewWilaya({ code: "", name: "", homeShippingCost: 600, stopdeskShippingCost: 400 });
      await refetchWilayas();
      // Add the new wilaya to editedWilayas
      setEditedWilayas(prev => ({
        ...prev,
        [res.data._id]: {
          homeShippingCost: res.data.homeShippingCost,
          stopdeskShippingCost: res.data.stopdeskShippingCost,
          isActive: res.data.isActive,
        },
      }));
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to add wilaya");
    } finally {
      setIsAddingWilaya(false);
    }
  };

  const handleSubmitStore = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const inputClass = "w-full py-2.5 px-3 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground font-sans mt-1.5";
  const labelClass = "text-xs uppercase tracking-[1px] text-muted-foreground font-medium";
  const numInputClass = "py-1.5 px-2 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground transition-colors w-28 text-right";

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-secondary animate-pulse" />
        <div className="h-96 w-full bg-secondary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[900px] space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-light tracking-[2px] flex items-center gap-2">
          <Settings size={20} className="text-accent" /> STORE SETTINGS
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure global store settings and per-wilaya delivery fees</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          { id: "store", label: "Store Profile" },
          { id: "shipping", label: "Wilaya Shipping Rates" },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-xs uppercase tracking-[1.5px] border-b-2 transition-colors cursor-pointer bg-transparent ${
              activeTab === tab.id
                ? "border-foreground text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Store Profile Tab ── */}
        {activeTab === "store" && (
          <motion.form
            key="store"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSubmitStore}
            className="space-y-8 bg-card border border-border p-6 md:p-8"
          >
            {/* Store Profile Section */}
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-[1.5px] border-b border-border pb-2 text-foreground font-normal">Store Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Store Name *</label>
                  <input type="text" name="storeName" value={formData.storeName}
                    onChange={e => setFormData(p => ({ ...p, storeName: e.target.value }))}
                    required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Contact Email *</label>
                  <input type="email" name="contactEmail" value={formData.contactEmail}
                    onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))}
                    required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Support Phone Number *</label>
                  <input type="text" name="contactPhone" value={formData.contactPhone}
                    onChange={e => setFormData(p => ({ ...p, contactPhone: e.target.value }))}
                    required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Line (with country code) *</label>
                  <input type="text" name="whatsappNumber" value={formData.whatsappNumber}
                    onChange={e => setFormData(p => ({ ...p, whatsappNumber: e.target.value }))}
                    required placeholder="213550123456" className={inputClass} />
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.5px]">Must start with country code (e.g. 213 for Algeria) without + or 00</p>
                </div>
              </div>
            </div>

            {/* Default Pricing & Shipping Section */}
            <div className="space-y-4 font-sans">
              <h2 className="text-sm uppercase tracking-[1.5px] border-b border-border pb-2 text-foreground font-normal">Default Shipping (Fallback)</h2>
              <p className="text-xs text-muted-foreground">These are fallback values used when a wilaya-specific rate is not found. Set per-wilaya rates in the "Wilaya Shipping Rates" tab.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Default Home Delivery (DA) *</label>
                  <input type="number" name="shippingFeeHome" value={formData.shippingFeeHome}
                    onChange={e => setFormData(p => ({ ...p, shippingFeeHome: Math.max(0, parseInt(e.target.value) || 0) }))}
                    required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Default Stopdesk (DA) *</label>
                  <input type="number" name="shippingFeeStopdesk" value={formData.shippingFeeStopdesk}
                    onChange={e => setFormData(p => ({ ...p, shippingFeeStopdesk: Math.max(0, parseInt(e.target.value) || 0) }))}
                    required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Free Shipping Threshold (DA) *</label>
                  <input type="number" name="freeShippingThreshold" value={formData.freeShippingThreshold}
                    onChange={e => setFormData(p => ({ ...p, freeShippingThreshold: Math.max(0, parseInt(e.target.value) || 0) }))}
                    required className={inputClass} />
                </div>
              </div>
            </div>

            {/* Marketing Banner Section */}
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-[1.5px] border-b border-border pb-2 text-foreground font-normal">Header Announcement Banner</h2>
              <div className="flex items-center gap-3 mb-4 select-none">
                <input type="checkbox" id="promoBannerActive" name="promoBannerActive"
                  checked={formData.promoBannerActive}
                  onChange={e => setFormData(p => ({ ...p, promoBannerActive: e.target.checked }))}
                  className="w-4 h-4 accent-foreground cursor-pointer" />
                <label htmlFor="promoBannerActive" className="text-sm cursor-pointer uppercase tracking-[0.5px] text-foreground font-medium">
                  Activate promo announcement banner
                </label>
              </div>
              <div>
                <label className={labelClass}>Banner Text</label>
                <textarea name="promoBannerText" value={formData.promoBannerText}
                  onChange={e => setFormData(p => ({ ...p, promoBannerText: e.target.value }))}
                  rows={3} placeholder="e.g. Free shipping on orders over 10,000 DA!"
                  className={`${inputClass} resize-none`} />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <button type="submit" disabled={updateMutation.isPending}
                className="px-6 py-3 bg-foreground text-background text-xs font-medium tracking-[1.5px] uppercase hover:bg-accent transition-colors cursor-pointer border-none flex items-center gap-2 rounded-none">
                {updateMutation.isPending ? <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                Save Configuration
              </button>
            </div>
          </motion.form>
        )}

        {/* ── Wilaya Shipping Tab ── */}
        {activeTab === "shipping" && (
          <motion.div
            key="shipping"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-normal tracking-[1.5px] uppercase flex items-center gap-2">
                  <MapPin size={14} className="text-accent" /> Per-Wilaya Shipping Rates
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Set individual home & stopdesk rates for all {wilayas.length} wilayas. Toggle a wilaya off to hide it from customers.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setShowAddWilaya(true)}
                  className="px-4 py-2 border border-border text-xs uppercase tracking-[1px] hover:border-foreground transition-colors bg-transparent cursor-pointer flex items-center gap-1">
                  <Plus size={12} /> Add Wilaya
                </button>
                <button onClick={handleSaveWilayas} disabled={isSavingWilayas}
                  className="px-5 py-2 bg-foreground text-background text-xs font-medium tracking-[1px] uppercase hover:bg-accent transition-colors border-none cursor-pointer flex items-center gap-2 disabled:opacity-60">
                  {isSavingWilayas ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
                  Save Rates
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search wilaya by name or code..."
                value={wilayaSearch}
                onChange={e => setWilayaSearch(e.target.value)}
                className="w-full py-2.5 pl-9 pr-4 bg-background border border-border text-sm outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Legend */}
            <div className="flex gap-6 text-xs text-muted-foreground bg-secondary/50 px-4 py-2.5 border border-border">
              <span className="inline-flex items-center gap-1"><Home size={11} /> <strong>Home</strong> = Livraison à domicile</span>
              <span className="inline-flex items-center gap-1"><Store size={11} /> <strong>Stopdesk</strong> = Retrait au bureau</span>
              <span className="ml-auto">{filteredWilayas.length} of {wilayas.length} wilayas</span>
            </div>

            {/* Wilaya list */}
            {wilayasLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 bg-secondary animate-pulse border border-border" />
                ))}
              </div>
            ) : (
              <div className="border border-border divide-y divide-border overflow-hidden">
                {filteredWilayas.map(w => {
                  const edits = editedWilayas[w._id] || {
                    homeShippingCost: w.homeShippingCost,
                    stopdeskShippingCost: w.stopdeskShippingCost,
                    isActive: w.isActive,
                  };
                  const isExpanded = expandedWilaya === w._id;

                  return (
                    <div key={w._id} className={`transition-colors ${!edits.isActive ? "opacity-50" : ""}`}>
                      {/* Row header */}
                      <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Code */}
                          <span className="text-xs text-muted-foreground font-mono w-7 shrink-0">{w.code}</span>

                          {/* Name & Mobile rates */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium truncate">{w.name}</span>
                            <div className="flex sm:hidden items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                              <span className="inline-flex items-center gap-1"><Home size={10} /><strong>{edits.homeShippingCost.toLocaleString("fr-DZ")} DA</strong></span>
                              <span className="inline-flex items-center gap-1"><Store size={10} /><strong>{edits.stopdeskShippingCost.toLocaleString("fr-DZ")} DA</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {/* Desktop rate display */}
                          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Home size={10} /><strong className="text-foreground">{edits.homeShippingCost.toLocaleString("fr-DZ")} DA</strong></span>
                            <span className="inline-flex items-center gap-1"><Store size={10} /><strong className="text-foreground">{edits.stopdeskShippingCost.toLocaleString("fr-DZ")} DA</strong></span>
                          </div>

                          {/* Toggle active */}
                          <button
                            type="button"
                            onClick={() => handleWilayaChange(w._id, "isActive", !edits.isActive)}
                            className={`text-[11px] px-2 py-1 border transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                              edits.isActive
                                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                : "bg-secondary border-border text-muted-foreground hover:border-foreground"
                            }`}
                            title={edits.isActive ? "Click to disable this wilaya" : "Click to enable this wilaya"}
                          >
                            {edits.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                            {edits.isActive ? "Active" : "Inactive"}
                          </button>

                          {/* Expand */}
                          <button
                            type="button"
                            onClick={() => setExpandedWilaya(isExpanded ? null : w._id)}
                            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer shrink-0"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded edit panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-secondary/20 px-4 pb-4 pt-3 border-t border-border"
                          >
                            <div className="flex flex-wrap gap-6 items-end">
                              <div>
                                <label className="flex items-center gap-1 text-[10px] uppercase tracking-[1px] text-muted-foreground mb-1"><Home size={10} /> Home Delivery (DA)</label>
                                <input
                                  type="number"
                                  value={edits.homeShippingCost}
                                  onChange={e => handleWilayaChange(w._id, "homeShippingCost", Math.max(0, parseInt(e.target.value) || 0))}
                                  className={numInputClass}
                                  min={0}
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-1 text-[10px] uppercase tracking-[1px] text-muted-foreground mb-1"><Store size={10} /> Stop Desk (DA)</label>
                                <input
                                  type="number"
                                  value={edits.stopdeskShippingCost}
                                  onChange={e => handleWilayaChange(w._id, "stopdeskShippingCost", Math.max(0, parseInt(e.target.value) || 0))}
                                  className={numInputClass}
                                  min={0}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground pb-0.5">
                                Click <strong>Save Rates</strong> to apply all changes at once.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save button at bottom */}
            <div className="flex justify-end">
              <button onClick={handleSaveWilayas} disabled={isSavingWilayas}
                className="px-6 py-3 bg-foreground text-background text-xs font-medium tracking-[1.5px] uppercase hover:bg-accent transition-colors border-none cursor-pointer flex items-center gap-2 disabled:opacity-60">
                {isSavingWilayas ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                Save All Rates
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Wilaya Modal */}
      <AnimatePresence>
        {showAddWilaya && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30"
            onClick={e => { if (e.target === e.currentTarget) setShowAddWilaya(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border border-border p-6 max-w-md w-full mx-4 shadow-2xl space-y-4"
            >
              <h3 className="text-sm uppercase tracking-[1.5px] font-medium">Add New Wilaya</h3>
              <p className="text-xs text-muted-foreground">Use this to add new or custom delivery zones.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-[1px] text-muted-foreground mb-1">Code *</label>
                  <input type="text" placeholder="e.g. 59"
                    value={newWilaya.code}
                    onChange={e => setNewWilaya(p => ({ ...p, code: e.target.value }))}
                    className="w-full py-2 px-3 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[1px] text-muted-foreground mb-1">Name *</label>
                  <input type="text" placeholder="e.g. Nouvelle Wilaya"
                    value={newWilaya.name}
                    onChange={e => setNewWilaya(p => ({ ...p, name: e.target.value }))}
                    className="w-full py-2 px-3 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground" />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] uppercase tracking-[1px] text-muted-foreground mb-1"><Home size={10} /> Home Cost (DA)</label>
                  <input type="number" min={0}
                    value={newWilaya.homeShippingCost}
                    onChange={e => setNewWilaya(p => ({ ...p, homeShippingCost: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="w-full py-2 px-3 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground" />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] uppercase tracking-[1px] text-muted-foreground mb-1"><Store size={10} /> Stopdesk Cost (DA)</label>
                  <input type="number" min={0}
                    value={newWilaya.stopdeskShippingCost}
                    onChange={e => setNewWilaya(p => ({ ...p, stopdeskShippingCost: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="w-full py-2 px-3 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground" />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowAddWilaya(false)}
                  className="px-4 py-2 border border-border text-xs uppercase tracking-[1px] bg-transparent cursor-pointer hover:border-foreground transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleAddWilaya} disabled={isAddingWilaya}
                  className="px-5 py-2 bg-foreground text-background text-xs uppercase tracking-[1px] border-none cursor-pointer hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isAddingWilaya ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
                  Add Wilaya
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSettings;
