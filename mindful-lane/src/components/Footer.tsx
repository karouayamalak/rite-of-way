import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary py-20 px-5">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
        <div>
          <h3 className="text-base font-medium tracking-[1px] mb-5">Shop</h3>
          <ul className="list-none space-y-3">
            {["All Products", "Hoodies", "T-Shirts", "Accessories"].map((item) => (
              <li key={item}>
                <Link
                  to="/shop"
                  className="text-secondary-foreground text-sm no-underline hover:text-accent transition-colors"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-base font-medium tracking-[1px] mb-5">Information</h3>
          <ul className="list-none space-y-3">
            {["About Us", "Stockists", "Shipping", "Returns"].map((item) => (
              <li key={item}>
                <Link
                  to="/about"
                  className="text-secondary-foreground text-sm no-underline hover:text-accent transition-colors"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-base font-medium tracking-[1px] mb-5">Support</h3>
          <ul className="list-none space-y-3">
            {["Contact Us", "FAQs", "Legal", "Privacy Policy"].map((item) => (
              <li key={item}>
                <Link
                  to="/about"
                  className="text-secondary-foreground text-sm no-underline hover:text-accent transition-colors"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-base font-medium tracking-[1px] mb-5">Connect</h3>
          <p className="text-secondary-foreground text-sm mb-5">
            Follow us for updates and inspiration
          </p>
          <div className="flex gap-4">
            {[Instagram, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex items-center justify-center w-9 h-9 bg-muted rounded-full text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto pt-10 border-t border-border text-center text-secondary-foreground text-sm">
        © {new Date().getFullYear()} Rite of Way. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
