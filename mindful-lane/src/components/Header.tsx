import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Menu, X, User, LogOut, Package, LayoutDashboard } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About" },
    { to: "/wishlist", label: "Wishlist" },
    { to: "/cart", label: "Cart" },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 bg-background transition-shadow duration-300 ${
        scrolled ? "shadow-sm" : ""
      } border-b border-border`}
    >
      <div className="max-w-[1400px] mx-auto px-5 py-3 flex justify-between items-center">
        <button
          className="md:hidden bg-transparent border-none text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link
          to="/"
          className="text-[1.8rem] font-light tracking-[2px] text-foreground no-underline"
        >
          RITE OF WAY
        </Link>

        <nav className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm uppercase tracking-[1px] no-underline transition-colors duration-300 ${
                location.pathname === link.to
                  ? "text-accent"
                  : "text-foreground hover:text-accent"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* Wishlist icon */}
          <Link to="/wishlist" className="relative text-foreground">
            <Heart size={18} />
            <AnimatePresence>
              {wishlistCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-[18px] h-[18px] text-[0.7rem] flex items-center justify-center"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Cart icon */}
          <Link to="/cart" className="relative text-foreground">
            <ShoppingBag size={18} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-[18px] h-[18px] text-[0.7rem] flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Account icon/dropdown */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative text-foreground bg-transparent border-none cursor-pointer hover:text-accent transition-colors">
                  <User size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-none border-border bg-background">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-[1px]">Signed in as</p>
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                </div>
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="text-sm uppercase tracking-[1px] cursor-pointer hover:text-accent gap-2"
                  >
                    <LayoutDashboard size={14} />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => navigate("/my-orders")}
                  className="text-sm uppercase tracking-[1px] cursor-pointer hover:text-accent gap-2"
                >
                  <Package size={14} />
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-sm uppercase tracking-[1px] cursor-pointer text-destructive hover:text-destructive gap-2"
                >
                  <LogOut size={14} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="text-foreground hover:text-accent transition-colors">
              <User size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-background border-t border-border"
          >
            <div className="flex flex-col gap-4 p-5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm uppercase tracking-[1px] no-underline text-foreground hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="text-sm uppercase tracking-[1px] no-underline text-foreground hover:text-accent transition-colors">
                      Admin Dashboard
                    </Link>
                  )}
                  <Link to="/my-orders" className="text-sm uppercase tracking-[1px] no-underline text-foreground hover:text-accent transition-colors">
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm uppercase tracking-[1px] text-left text-destructive bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-sm uppercase tracking-[1px] no-underline text-foreground hover:text-accent transition-colors">
                  Login / Register
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
