import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    setIsLoading(true);
    try {
      const res = await api.post<{ success: boolean; token: string }>(`/auth/reset-password/${token}`, { password: form.password });
      if (res.token) localStorage.setItem('row_token', res.token);
      toast.success("Password reset successfully!");
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Reset failed. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="pt-20 min-h-screen flex items-center justify-center px-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light tracking-[3px] mb-3">RESET PASSWORD</h1>
          <p className="text-muted-foreground text-sm">Enter your new password below</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 characters"
                className="w-full py-3 px-4 pr-12 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground bg-transparent border-none cursor-pointer">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-2">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Re-enter password"
              className="w-full py-3 px-4 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
            />
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full py-4 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors border-none cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {isLoading ? <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              : <> Reset Password <ArrowRight size={16} /> </>}
          </button>
        </form>
      </motion.div>
    </main>
  );
};

export default ResetPassword;
