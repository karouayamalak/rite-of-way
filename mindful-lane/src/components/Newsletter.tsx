import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thank you for subscribing!");
      setEmail("");
    } else {
      toast.error("Please enter a valid email address.");
    }
  };

  return (
    <section className="bg-newsletter text-newsletter-foreground py-24 px-5">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[600px] mx-auto text-center"
      >
        <h2 className="text-[2.2rem] font-light tracking-[2px] mb-5">
          JOIN OUR NEWSLETTER
        </h2>
        <p className="text-newsletter-muted mb-8">
          Stay updated on new releases, events, and exclusive offers.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-[500px] mx-auto">
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-4 border border-muted-foreground/30 bg-transparent text-newsletter-foreground placeholder:text-newsletter-muted/60 text-base focus:outline-none focus:border-newsletter-foreground transition-colors"
          />
          <button
            type="submit"
            className="bg-newsletter-foreground text-newsletter px-8 py-4 font-medium tracking-[1px] uppercase text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors sm:mt-0 mt-3"
          >
            Subscribe
          </button>
        </form>
      </motion.div>
    </section>
  );
};

export default Newsletter;
