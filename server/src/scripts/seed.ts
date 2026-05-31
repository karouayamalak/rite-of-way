import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { connectDB, disconnectDB } from '../lib/db';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Category } from '../models/Category';

// ─── Seed Data ─────────────────────────────────────────────────────────────
// Using placeholder Cloudinary URLs — replace with real images after upload
const PLACEHOLDER = 'https://placehold.co/800x1067/f0f0f0/333333?text=';

const categories = [
  { name: 'Hoodies', order: 1 },
  { name: 'T-Shirts', order: 2 },
  { name: 'Sweatshirts', order: 3 },
  { name: 'Pants', order: 4 },
  { name: 'Hats', order: 5 },
  { name: 'Glasses', order: 6 },
  { name: 'Shoes', order: 7 },
  { name: 'Jackets', order: 8 },
];

const products = [
  {
    title: 'Rite of Way 1977 Hoodie',
    description: 'A premium heavyweight hoodie featuring the iconic 1977 graphic. Made from organic cotton with a relaxed fit.',
    price: 12500,
    category: 'Hoodies',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'White', 'Gray'],
    stock: 50,
    images: [{ url: `${PLACEHOLDER}1977+Hoodie`, publicId: '', alt: 'Rite of Way 1977 Hoodie' }],
    badge: 'New',
    isFeatured: true,
    isNew: true,
  },
  {
    title: 'Rite of Way Gray Hoodie',
    description: 'Classic gray hoodie with subtle branding. Soft-touch fleece interior for everyday comfort.',
    price: 10500,
    category: 'Hoodies',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Gray'],
    stock: 35,
    images: [{ url: `${PLACEHOLDER}Gray+Hoodie`, publicId: '', alt: 'Gray Hoodie' }],
    isFeatured: true,
  },
  {
    title: 'Essentials Hoodie',
    description: 'The everyday essential. Lightweight, breathable, and perfectly fitted for layering.',
    price: 4800,
    category: 'Hoodies',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'White'],
    stock: 80,
    images: [{ url: `${PLACEHOLDER}Essentials+Hoodie`, publicId: '', alt: 'Essentials Hoodie' }],
    badge: 'Best Seller',
    isFeatured: true,
    isTrending: true,
  },
  {
    title: 'Rite of Way Classic Tee',
    description: 'Minimalist tee with embroidered logo. 100% organic cotton.',
    price: 3500,
    category: 'T-Shirts',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'White', 'Cream'],
    stock: 100,
    images: [{ url: `${PLACEHOLDER}Classic+Tee`, publicId: '', alt: 'Classic Tee' }],
    isNew: true,
  },
  {
    title: 'Heritage Crew Neck',
    description: 'Heritage-inspired crew neck sweatshirt. Heavy-weight French terry construction.',
    price: 9200,
    category: 'Sweatshirts',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Navy', 'Olive', 'Burgundy'],
    stock: 25,
    images: [{ url: `${PLACEHOLDER}Heritage+Crew`, publicId: '', alt: 'Heritage Crew Neck' }],
    badge: 'Limited',
    isTrending: true,
  },
  {
    title: 'Essential Joggers',
    description: 'Tapered joggers with elastic cuffs. The perfect companion to our hoodies.',
    price: 6800,
    category: 'Pants',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Gray', 'Navy'],
    stock: 60,
    images: [{ url: `${PLACEHOLDER}Joggers`, publicId: '', alt: 'Essential Joggers' }],
  },
  {
    title: 'Cargo Streetwear Pants',
    description: 'Relaxed cargo pants with multiple pockets. Durable twill fabric for everyday wear.',
    price: 7500,
    category: 'Pants',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Khaki', 'Black', 'Olive'],
    stock: 40,
    images: [{ url: `${PLACEHOLDER}Cargo+Pants`, publicId: '', alt: 'Cargo Pants' }],
    badge: 'New',
    isNew: true,
  },
  {
    title: 'Classic Chinos',
    description: 'Slim-fit chinos in a versatile colorway. Stretch cotton blend for comfort.',
    price: 5500,
    category: 'Pants',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Beige', 'Navy', 'Charcoal'],
    stock: 55,
    images: [{ url: `${PLACEHOLDER}Chinos`, publicId: '', alt: 'Classic Chinos' }],
  },
  {
    title: 'Polo Classic Cap',
    description: 'Structured cap with embroidered logo. Adjustable closure for a perfect fit. Premium cotton twill.',
    price: 2800,
    category: 'Hats',
    sizes: ['One Size'],
    colors: ['Black', 'White', 'Navy'],
    stock: 75,
    images: [{ url: `${PLACEHOLDER}Classic+Cap`, publicId: '', alt: 'Classic Cap' }],
    badge: 'New',
    isNew: true,
  },
  {
    title: 'C.P. Company Goggle Beanie',
    description: 'Iconic goggle beanie in ribbed wool. Available in olive, camel, and cream. The ultimate streetwear accessory.',
    price: 4500,
    category: 'Hats',
    sizes: ['One Size'],
    colors: ['Olive', 'Camel', 'Cream'],
    stock: 30,
    images: [{ url: `${PLACEHOLDER}Goggle+Beanie`, publicId: '', alt: 'Goggle Beanie' }],
    badge: 'Best Seller',
    isTrending: true,
  },
  {
    title: 'Bucket Hat',
    description: 'Relaxed bucket hat with subtle branding. Lightweight and packable for travel.',
    price: 3200,
    category: 'Hats',
    sizes: ['One Size'],
    colors: ['Beige', 'Black', 'White'],
    stock: 45,
    images: [{ url: `${PLACEHOLDER}Bucket+Hat`, publicId: '', alt: 'Bucket Hat' }],
  },
  {
    title: 'Oscar Magnuson Square Frames',
    description: 'Handcrafted square frames with green lenses and UV400 protection. Lightweight acetate construction from Sweden.',
    price: 4500,
    category: 'Glasses',
    sizes: ['One Size'],
    colors: ['Tortoise', 'Black'],
    stock: 20,
    images: [{ url: `${PLACEHOLDER}Square+Frames`, publicId: '', alt: 'Square Frames' }],
  },
  {
    title: 'Vintage Clubmaster Sunglasses',
    description: 'Classic clubmaster silhouette with polarized green lenses. Tortoise acetate frame with gold accents.',
    price: 5200,
    category: 'Glasses',
    sizes: ['One Size'],
    colors: ['Tortoise/Gold'],
    stock: 15,
    images: [{ url: `${PLACEHOLDER}Clubmaster`, publicId: '', alt: 'Vintage Clubmaster' }],
    badge: 'Limited',
  },
  {
    title: 'Wayfarer Sunglasses',
    description: 'Iconic wayfarer shape with gradient lenses. Durable polycarbonate frame.',
    price: 3800,
    category: 'Glasses',
    sizes: ['One Size'],
    colors: ['Black', 'Tortoise'],
    stock: 35,
    images: [{ url: `${PLACEHOLDER}Wayfarer`, publicId: '', alt: 'Wayfarer Sunglasses' }],
  },
  {
    title: 'Adidas Gazelle Blue',
    description: 'Classic Gazelle silhouette in dusty blue suede with signature three stripes. Gum sole for authentic retro style.',
    price: 14500,
    category: 'Shoes',
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: ['Dusty Blue'],
    stock: 18,
    images: [{ url: `${PLACEHOLDER}Gazelle+Blue`, publicId: '', alt: 'Adidas Gazelle Blue' }],
    badge: 'New',
    isNew: true,
    isFeatured: true,
  },
  {
    title: 'Adidas Leather Classics',
    description: 'Premium full-grain leather sneakers in black and brown. Silver trefoil detailing. Built for everyday luxury.',
    price: 16800,
    category: 'Shoes',
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: ['Black', 'Brown'],
    stock: 12,
    images: [{ url: `${PLACEHOLDER}Leather+Classics`, publicId: '', alt: 'Leather Classics' }],
    badge: 'Limited',
  },
  {
    title: 'ENRAGE Denim Clasp Jacket',
    description: 'Raw selvedge denim jacket with signature metal clasp closures. Cropped boxy fit. Contrast stitching throughout.',
    price: 18500,
    category: 'Jackets',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Raw Denim', 'Washed Black'],
    stock: 10,
    images: [{ url: `${PLACEHOLDER}Denim+Jacket`, publicId: '', alt: 'Denim Jacket' }],
    badge: 'New',
    isFeatured: true,
    isNew: true,
  },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting database seed...\n');

    // Clear existing data
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing products and categories');

    // Seed categories
    await Category.create(categories);
    console.log(`✅ Seeded ${categories.length} categories`);

    // Seed products
    const productsWithVariants = products.map((p) => {
      const colors = p.colors || [];
      const sizes = p.sizes || [];
      const totalStock = p.stock || 0;

      // Distribute stock across variants
      const comboCount = colors.length * sizes.length;
      const distributedStock = comboCount > 0 ? Math.ceil(totalStock / comboCount) : 0;

      const variants = colors.map((color) => ({
        color,
        sizes: sizes.map((size) => ({
          size,
          stock: distributedStock,
        })),
      }));

      return {
        ...p,
        variants,
      };
    });

    await Product.create(productsWithVariants);
    console.log(`✅ Seeded ${products.length} products`);

    // Create admin user if it doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@riteofway.dz';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isVerified: true,
      });
      console.log(`✅ Created admin user: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
    }

    console.log('\n🎉 Database seeded successfully!\n');
    console.log(`📧 Admin login: ${adminEmail}`);
    console.log(`🔑 Admin password: ${adminPassword}\n`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

seed();
