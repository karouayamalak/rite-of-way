import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email address"); return; }
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="pt-20 min-h-screen flex items-center justify-center px-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary flex items-center justify-center mx-auto mb-6">
              <Mail size={28} className="text-accent" />
            </div>
            <h1 className="text-2xl font-light tracking-[2px] mb-4">CHECK YOUR EMAIL</h1>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              Check your inbox (and spam folder).
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-light tracking-[3px] mb-3">FORGOT PASSWORD</h1>
              <p className="text-muted-foreground text-sm">
                Enter your email and we'll send you a reset link
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full py-3 px-4 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : (
                  <> Send Reset Link <ArrowRight size={16} /> </>
                )}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </main>
  );
};

export default ForgotPassword;
