import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Shield, Leaf, Heart, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import heroImage from "@/assets/hero-image.jpg";
import storyImage from "@/assets/story-image.jpg";
import ProductCard from "@/components/ProductCard";
import Newsletter from "@/components/Newsletter";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface ApiProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number;
  images: { url: string; alt?: string }[];
  badge?: string;
  description?: string;
  category: string;
}

const features = [
  { icon: Truck, title: "Nationwide Delivery", description: "Fast shipping across all 58 wilayas of Algeria" },
  { icon: Shield, title: "Quality Guarantee", description: "Every piece is crafted with premium materials" },
  { icon: Leaf, title: "Sustainable", description: "Ethically sourced and environmentally conscious" },
  { icon: Heart, title: "Made with Love", description: "Handcrafted with attention to every detail" },
];

const testimonials = [
  {
    name: "Sarah B.",
    location: "Alger",
    rating: 5,
    text: "Les parfums sont d'une élégance rare et d'une tenue exceptionnelle. L'option livraison Yalidine Stop Desk est très pratique et économique. Le service client WhatsApp est adorable !",
    highlight: "Stop Desk & WhatsApp"
  },
  {
    name: "Amine K.",
    location: "Oran",
    rating: 5,
    text: "Une expérience d'achat haut de gamme en Algérie. Commande passée en quelques secondes sur WhatsApp, confirmée par appel téléphonique rapide et reçue sous 48h. Qualité irréprochable.",
    highlight: "Service Ultra Rapide"
  },
  {
    name: "Yasmine T.",
    location: "Constantine",
    rating: 5,
    text: "Entièrement satisfaite de ma commande. La livraison à domicile a été rapide et le livreur très courtois. Le packaging minimaliste et luxueux fait toute la différence.",
    highlight: "Livraison à Domicile"
  }
];

const Index = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () =>
      api.get<{ success: boolean; data: ApiProduct[] }>(
        "/products?isFeatured=true&limit=3"
      ),
    staleTime: 1000 * 60 * 5,
  });

  const featured = data?.data || [];

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="h-[90vh] relative flex items-center justify-center text-center overflow-hidden">
        <img
          src={heroImage}
          alt="Rite of Way hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/20" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 max-w-[800px] px-5"
        >
          <h1 className="text-4xl md:text-6xl font-light tracking-[3px] mb-5 text-primary-foreground">
            LET THE LIGHT IN
          </h1>
          <p className="text-lg mb-8 text-primary-foreground/80 max-w-[600px] mx-auto">
            Discover our signature pieces crafted with intention and care.
          </p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3 bg-background text-foreground border border-background text-sm font-medium tracking-[1px] uppercase hover:bg-transparent hover:text-primary-foreground hover:border-primary-foreground transition-colors duration-300 no-underline"
          >
            Shop Now
          </Link>
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-5 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-[2.2rem] font-light tracking-[2px] mb-4">FEATURED PRODUCTS</h2>
          <p className="text-muted-foreground max-w-[600px] mx-auto">
            Explore our collection of thoughtfully designed items
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[400px] w-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                  <Skeleton className="h-9 w-32 mx-auto" />
                </div>
              ))
            : featured.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={{
                    id: p._id,
                    title: p.title,
                    price: p.discountPrice || p.price,
                    image: p.images?.[0]?.url || `https://placehold.co/800x1067/f0f0f0/333333?text=${encodeURIComponent(p.title)}`,
                    badge: p.badge,
                    description: p.description,
                    category: p.category,
                  }}
                  index={i}
                  slug={p.slug}
                />
              ))}
        </div>
        <div className="text-center mt-12">
          <Link
            to="/shop"
            className="inline-block px-8 py-3 border border-foreground text-foreground text-sm font-medium tracking-[1px] uppercase hover:bg-foreground hover:text-background transition-colors duration-300 no-underline"
          >
            View All Products
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary py-20 px-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-[1200px] mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-8"
            >
              <feature.icon className="mx-auto mb-5 text-accent" size={40} strokeWidth={1} />
              <h3 className="text-lg font-normal tracking-[1px] mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-5 max-w-[1400px] mx-auto border-t border-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-[2.2rem] font-light tracking-[2px] mb-4 uppercase">Ce que disent nos clients</h2>
          <p className="text-muted-foreground max-w-[600px] mx-auto text-sm">
            La perfection dans les détails, de la commande à la livraison à travers l'Algérie.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="bg-card border border-border p-8 relative flex flex-col justify-between hover:border-foreground/30 hover:shadow-xl transition-all duration-300 group"
            >
              <div>
                <div className="flex gap-1 mb-4 text-accent">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} size={14} fill="currentColor" stroke="none" />
                  ))}
                </div>
                <p className="text-sm italic leading-relaxed text-muted-foreground mb-6">
                  "{t.text}"
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto">
                <div>
                  <h4 className="text-sm font-medium text-foreground">{t.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.location}, DZ</p>
                </div>
                <span className="text-[10px] uppercase font-medium tracking-[1.5px] bg-secondary text-foreground px-2.5 py-1">
                  {t.highlight}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-10 md:p-20 flex flex-col justify-center bg-secondary"
        >
          <h2 className="text-[2.2rem] font-light tracking-[2px] mb-6">ABOUT RITE OF WAY</h2>
          <p className="text-muted-foreground mb-5">
            Scent is a portal unearned to show you the way inward.
          </p>
          <p className="text-muted-foreground mb-8">
            Founded in Brooklyn, NY, Rite of Way creates intentional fragrances and accessories
            designed to connect you with your inner self and the world around you.
          </p>
          <Link
            to="/about"
            className="self-start inline-block px-8 py-3 border border-foreground text-foreground text-sm font-medium tracking-[1px] uppercase hover:bg-foreground hover:text-background transition-colors duration-300 no-underline"
          >
            Learn More
          </Link>
        </motion.div>
        <div
          className="min-h-[300px] md:min-h-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${storyImage})` }}
        />
      </section>

      <Newsletter />
    </main>
  );
};

export default Index;
