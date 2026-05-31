import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { api } from "@/lib/api";

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <main className="pt-20 min-h-screen flex items-center justify-center px-5">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-[400px]">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <span className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-muted-foreground text-sm">Verifying your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Check size={28} className="text-accent" />
            </div>
            <h1 className="text-2xl font-light tracking-[2px] mb-4">EMAIL VERIFIED</h1>
            <p className="text-muted-foreground mb-8 text-sm">Your email has been verified. You're all set!</p>
            <Link to="/" className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors no-underline">
              Continue Shopping
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <X size={28} className="text-destructive" />
            </div>
            <h1 className="text-2xl font-light tracking-[2px] mb-4">VERIFICATION FAILED</h1>
            <p className="text-muted-foreground mb-8 text-sm">This verification link is invalid or has expired.</p>
            <Link to="/login" className="inline-block px-8 py-3 border border-foreground text-foreground text-sm font-medium tracking-[1px] uppercase hover:bg-foreground hover:text-background transition-colors no-underline">
              Back to Login
            </Link>
          </>
        )}
      </motion.div>
    </main>
  );
};

export default VerifyEmail;
