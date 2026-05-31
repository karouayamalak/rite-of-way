# Rite of Way - Minimalist  E-Shop

This is a luxury clothing online shop made for the Algerian market. It is simple, modern, and has a beautiful design.

## Tech Stack

* **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion
* **Backend**: Node.js, Express, TypeScript, MongoDB
* **Login**: JWT tokens (access and refresh)
* **Images**: Cloudinary (automatically saves to your local computer if Cloudinary is not set up)

## Features

* **WhatsApp Order**: Clients can order directly by clicking the WhatsApp button on product pages.
* **Yalidine Delivery**: Clients can choose Home Delivery or Yalidine Pickup Office (Stop Desk) during checkout.
* **Wilaya Shipping Costs**: Automatic shipping price calculated for all 58 Wilayas.
* **Print Shipping Labels**: Admin can print clean shipping labels for packages with Domicile or Stop Desk badges.
* **Admin Dashboard**: Track sales, see orders, and manage products easily.
* **Discount Coupons**: Create promo codes for percentage discounts or fixed DA discounts.
* **Local Image Fallback**: Saves uploaded product pictures on the server if Cloudinary is not set up.

## How to Run

### What you need
* Node.js (version 18 or higher)
* MongoDB (local or Atlas link)

### 1. Copy the project
Clone the repository and go into the folder:
```bash
git clone <your-repo-url>
cd eshop
```

### 2. Set up the Backend

Go to the `server` folder, create a `.env` file, and copy variables from `.env.example`.

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:8080

# Cloudinary (leave blank to save files on your computer)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

ADMIN_EMAIL=admin@riteofway.dz
ADMIN_PASSWORD=Admin@123456
```

Then run these commands in the `server` folder:
```bash
npm install
npm run seed     # Seeds categories, products, and default admin user
npm run dev      # Runs backend on http://localhost:5000
```

### 3. Set up the Frontend

Go to the `mindful-lane` folder and create a `.env` file:
```env
VITE_API_URL=http://localhost:5000
VITE_WHATSAPP_NUMBER=213550123456 # your WhatsApp business number
```

Then run these commands in the `mindful-lane` folder:
```bash
npm install
npm run dev      # Runs frontend on http://localhost:8080
```

## Admin Login Info
To access the admin dashboard, log in with these credentials:
* **Email**: admin@riteofway.dz
* **Password**: Admin@123456

## How to Build for Production
To build the project for a live server:
```bash
# Build Backend
cd server
npm run build

# Build Frontend
cd mindful-lane
npm run build
```
