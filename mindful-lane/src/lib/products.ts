import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product6 from "@/assets/product-6.jpg";
import product7 from "@/assets/product-7.jpg";
import product8 from "@/assets/product-8.jpg";
import product16 from "@/assets/product-16.jpg";
import product18 from "@/assets/product-18.jpg";
import glasses1 from "@/assets/product-glasses-1.jpg";
import glasses2 from "@/assets/product-glasses-2.jpg";
import type { Product } from "./cart-context";

export const products: Product[] = [
  // Hoodies
  {
    id: "1",
    title: "Rite of Way 1977 Hoodie",
    price: 12500,
    image: product1,
    badge: "New",
    description: "A premium heavyweight hoodie featuring the iconic 1977 graphic. Made from organic cotton with a relaxed fit.",
    category: "Hoodies",
  },
  {
    id: "2",
    title: "Rite of Way Gray Hoodie",
    price: 10500,
    image: product2,
    description: "Classic gray hoodie with subtle branding. Soft-touch fleece interior for everyday comfort.",
    category: "Hoodies",
  },
  {
    id: "3",
    title: "Essentials Hoodie",
    price: 4800,
    image: product3,
    badge: "Best Seller",
    description: "The everyday essential. Lightweight, breathable, and perfectly fitted for layering.",
    category: "Hoodies",
  },
  // T-Shirts
  {
    id: "4",
    title: "Rite of Way Classic Tee",
    price: 3500,
    image: product1,
    description: "Minimalist tee with embroidered logo. 100% organic cotton.",
    category: "T-Shirts",
  },
  // Sweatshirts
  {
    id: "5",
    title: "Heritage Crew Neck",
    price: 9200,
    image: product2,
    badge: "Limited",
    description: "Heritage-inspired crew neck sweatshirt. Heavy-weight French terry construction.",
    category: "Sweatshirts",
  },
  // Pants
  {
    id: "6",
    title: "Essential Joggers",
    price: 6800,
    image: product3,
    description: "Tapered joggers with elastic cuffs. The perfect companion to our hoodies.",
    category: "Pants",
  },
  {
    id: "7",
    title: "Cargo Streetwear Pants",
    price: 7500,
    image: product1,
    badge: "New",
    description: "Relaxed cargo pants with multiple pockets. Durable twill fabric for everyday wear.",
    category: "Pants",
  },
  {
    id: "8",
    title: "Classic Chinos",
    price: 5500,
    image: product2,
    description: "Slim-fit chinos in a versatile colorway. Stretch cotton blend for comfort.",
    category: "Pants",
  },
  // Hats
  {
    id: "9",
    title: "Polo Classic Cap",
    price: 2800,
    image: product6,
    badge: "New",
    description: "Structured cap with embroidered logo. Adjustable closure for a perfect fit. Premium cotton twill.",
    category: "Hats",
  },
  {
    id: "10",
    title: "C.P. Company Goggle Beanie",
    price: 4500,
    image: product18,
    badge: "Best Seller",
    description: "Iconic goggle beanie in ribbed wool. Available in olive, camel, and cream. The ultimate streetwear accessory.",
    category: "Hats",
  },
  {
    id: "11",
    title: "Bucket Hat",
    price: 3200,
    image: product2,
    description: "Relaxed bucket hat with subtle branding. Lightweight and packable for travel.",
    category: "Hats",
  },
  // Glasses
  {
    id: "12",
    title: "Oscar Magnuson Square Frames",
    price: 4500,
    image: glasses1,
    description: "Handcrafted square frames with green lenses and UV400 protection. Lightweight acetate construction from Sweden.",
    category: "Glasses",
  },
  {
    id: "13",
    title: "Vintage Clubmaster Sunglasses",
    price: 5200,
    image: glasses2,
    badge: "Limited",
    description: "Classic clubmaster silhouette with polarized green lenses. Tortoise acetate frame with gold accents.",
    category: "Glasses",
  },
  {
    id: "14",
    title: "Wayfarer Sunglasses",
    price: 3800,
    image: product2,
    description: "Iconic wayfarer shape with gradient lenses. Durable polycarbonate frame.",
    category: "Glasses",
  },
  // Shoes
  {
    id: "15",
    title: "Adidas Gazelle Blue",
    price: 14500,
    image: product16,
    badge: "New",
    description: "Classic Gazelle silhouette in dusty blue suede with signature three stripes. Gum sole for authentic retro style.",
    category: "Shoes",
  },
  {
    id: "16",
    title: "Adidas Leather Classics",
    price: 16800,
    image: product7,
    badge: "Limited",
    description: "Premium full-grain leather sneakers in black and brown. Silver trefoil detailing. Built for everyday luxury.",
    category: "Shoes",
  },
  // Jackets
  {
    id: "17",
    title: "ENRAGE Denim Clasp Jacket",
    price: 18500,
    image: product8,
    badge: "New",
    description: "Raw selvedge denim jacket with signature metal clasp closures. Cropped boxy fit. Contrast stitching throughout.",
    category: "Jackets",
  },
];
