import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, MapPin, Package, Tag, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { wilayas, formatDZD } from "@/lib/algeria-shipping";
import { api, ApiError } from "@/lib/api";

type Step = "shipping" | "confirmation";

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "shipping", label: "Order Details", icon: <MapPin size={18} /> },
  { id: "confirmation", label: "Confirmation", icon: <Check size={18} /> },
];

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("shipping");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [shipping, setShipping] = useState({
    firstName: user?.name.split(" ")[0] || "",
    lastName: user?.name.split(" ").slice(1).join(" ") || "",
    phone: "",
    address: "",
    wilaya: "",
    email: user?.email || "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [deliveryType, setDeliveryType] = useState<"home" | "stopdesk">("home");

  const selectedWilaya = wilayas.find((w) => w.name === shipping.wilaya);
  // stop desk is 200 DA cheaper
  const shippingCost = selectedWilaya
    ? deliveryType === "stopdesk"
      ? Math.max(0, selectedWilaya.shippingCost - 200)
      : selectedWilaya.shippingCost
    : 0;
  const grandTotal = totalPrice + shippingCost - discount;

  const handleValidateCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const res = await api.post<{ success: boolean; data: { code: string; discount: number; message: string } }>(
        "/coupons/validate",
        { code: couponInput, orderAmount: totalPrice }
      );
      setCouponCode(res.data.code);
      setDiscount(res.data.discount);
      toast.success(res.data.message);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Invalid coupon code");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponInput("");
    setDiscount(0);
  };

  if (items.length === 0 && currentStep !== "confirmation") {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center px-5">
          <Package size={64} strokeWidth={1} className="mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-light tracking-[2px] mb-4">NOTHING TO CHECKOUT</h1>
          <Link to="/shop" className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors no-underline">
            Shop Now
          </Link>
        </div>
      </main>
    );
  }

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping.firstName || !shipping.lastName || !shipping.phone || !shipping.address || !shipping.wilaya) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!user && !shipping.email) {
      toast.error("Please provide your email address");
      return;
    }

    setIsLoading(true);
    try {
      const orderItems = items.map((item) => ({
        product: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));

      const res = await api.post<{ success: boolean; data: { orderNumber: string; total: number } }>("/orders", {
        items: orderItems,
        shipping: {
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          phone: shipping.phone,
          address: shipping.address,
          wilaya: shipping.wilaya,
          shippingCost,
          deliveryType,
        },
        couponCode: couponCode || undefined,
        guestEmail: !user ? shipping.email : undefined,
      });

      setOrderNumber(res.data.orderNumber);
      setOrderTotal(res.data.total);
      setCurrentStep("confirmation");
      clearCart();
      toast.success("Order placed successfully!");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full py-3 px-3 bg-background border border-border text-foreground text-sm tracking-[0.5px] outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground";

  return (
    <main className="pt-20 min-h-screen">
      <section className="bg-secondary py-12 px-5 text-center">
        <h1 className="text-3xl font-light tracking-[3px]">CHECKOUT</h1>
        <p className="text-muted-foreground text-sm mt-2">Cash on Delivery — Algeria Only</p>
      </section>

      <div className="max-w-[700px] mx-auto px-5 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${i <= stepIndex ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                {i < stepIndex ? <Check size={16} /> : step.icon}
              </div>
              <span className={`text-xs uppercase tracking-[1px] hidden sm:inline ${i <= stepIndex ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
              {i < steps.length - 1 && <ChevronRight size={16} className="text-muted-foreground mx-2" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === "shipping" && (
            <motion.form key="shipping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
                <h2 className="text-xl font-light tracking-[2px] m-0">DELIVERY INFORMATION</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="First Name *" value={shipping.firstName} onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })} />
                <Input placeholder="Last Name *" value={shipping.lastName} onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })} />
              </div>
              <Input type="tel" placeholder="Phone Number *" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
              <Input placeholder="Street Address *" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />

              {!user && (
                <Input type="email" placeholder="Email (for order confirmation) *" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} />
              )}

              {/* Wilaya select */}
              <select value={shipping.wilaya} onChange={(e) => setShipping({ ...shipping, wilaya: e.target.value })}
                className={inputClass}>
                <option value="">Select Wilaya *</option>
                {wilayas.map((w) => (
                  <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
                ))}
              </select>

              {selectedWilaya && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                  {/* Delivery Type Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("home")}
                      className={`py-3 px-4 text-xs uppercase tracking-[1px] font-medium border transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                        deliveryType === "home"
                          ? "bg-foreground text-background border-foreground"
                          : "bg-transparent text-foreground border-border hover:border-foreground"
                      }`}
                    >
                      <span>🏠 Livraison à Domicile</span>
                      <span className="text-[10px] opacity-70">{formatDZD(selectedWilaya.shippingCost)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("stopdesk")}
                      className={`py-3 px-4 text-xs uppercase tracking-[1px] font-medium border transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                        deliveryType === "stopdesk"
                          ? "bg-foreground text-background border-foreground"
                          : "bg-transparent text-foreground border-border hover:border-foreground"
                      }`}
                    >
                      <span>🏪 Stop Desk (Retrait)</span>
                      <span className="text-[10px] opacity-70">{formatDZD(Math.max(0, selectedWilaya.shippingCost - 200))}</span>
                    </button>
                  </div>
                  <div className="bg-secondary p-4 text-sm">
                    {deliveryType === "home" ? (
                      <p>📦 Livraison chez vous à <strong>{selectedWilaya.name}</strong>: <strong>{formatDZD(shippingCost)}</strong></p>
                    ) : (
                      <p>🏪 Retrait au bureau Stop Desk à <strong>{selectedWilaya.name}</strong>: <strong>{formatDZD(shippingCost)}</strong></p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Coupon */}
              <div>
                <p className="text-sm uppercase tracking-[1px] mb-3">Coupon Code</p>
                {couponCode ? (
                  <div className="flex items-center gap-3 bg-accent/10 border border-accent px-4 py-3">
                    <Tag size={14} className="text-accent" />
                    <span className="text-sm flex-1"><strong>{couponCode}</strong> — {formatDZD(discount)} saved</span>
                    <button type="button" onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter coupon code" value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleValidateCoupon(); } }}
                      className={`${inputClass} flex-1`} />
                    <button type="button" onClick={handleValidateCoupon} disabled={isValidatingCoupon || !couponInput}
                      className="px-6 py-3 bg-foreground text-background text-xs font-medium tracking-[1px] uppercase hover:bg-accent transition-colors border-none cursor-pointer disabled:opacity-50 shrink-0">
                      {isValidatingCoupon ? "..." : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              {/* Order summary */}
              <div className="border-t border-border pt-6 mt-8">
                <h3 className="text-sm uppercase tracking-[1px] mb-4">Order Summary</h3>
                {items.map((item) => (
                  <div key={`${item.id}-${item.color || ''}-${item.size || ''}`} className="flex justify-between text-sm py-2">
                    <span>{item.title} {item.color || item.size ? `(${[item.color, item.size].filter(Boolean).join(" - ")})` : ""} × {item.quantity}</span>
                    <span>{formatDZD(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm py-2 border-t border-border mt-2 pt-2">
                  <span>Subtotal</span><span>{formatDZD(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm py-2">
                  <span>Shipping</span>
                  <span>{shipping.wilaya ? formatDZD(shippingCost) : "Select wilaya"}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm py-2 text-accent">
                    <span>Discount ({couponCode})</span><span>-{formatDZD(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-4 border-t border-border mt-2 text-base">
                  <span>Total</span><span>{formatDZD(grandTotal)}</span>
                </div>
              </div>

              <div className="bg-secondary/50 p-4 text-sm text-muted-foreground mt-4">
                💵 Payment: <strong className="text-foreground">Cash on Delivery</strong> — Pay when you receive your order.
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-4 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors cursor-pointer border-none mt-6 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {isLoading ? <><span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> Placing Order...</> : "Place Order"}
              </button>
            </motion.form>
          )}

          {currentStep === "confirmation" && (
            <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-8">
                <Check size={36} className="text-accent" />
              </div>
              <h2 className="text-2xl font-light tracking-[2px] mb-2">ORDER CONFIRMED</h2>
              <p className="text-muted-foreground text-sm mb-1">Order #{orderNumber}</p>
              <p className="text-muted-foreground mb-2 text-sm">Thank you for your order!</p>
              <p className="text-muted-foreground mb-2 text-sm">
                We will deliver to <strong>{shipping.wilaya}</strong>
              </p>
              <p className="text-muted-foreground mb-8 text-sm">
                You will pay <strong>{formatDZD(orderTotal)}</strong> on delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user && (
                  <Link to="/my-orders" className="inline-block px-8 py-3 border border-foreground text-foreground text-sm font-medium tracking-[1px] uppercase hover:bg-foreground hover:text-background transition-colors no-underline">
                    Track Orders
                  </Link>
                )}
                <Link to="/shop" className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors no-underline">
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default Checkout;
