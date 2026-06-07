import mongoose from 'mongoose';
import dns from 'dns';

// Only set custom DNS options in development to avoid issues in restricted serverless environments like Vercel
if (process.env.NODE_ENV === 'development') {
  dns.setDefaultResultOrder('ipv4first');
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (err) {
    console.warn('Failed to set DNS servers:', err);
  }
}

let isConnected = false;

const setupConnectionEvents = () => {
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
    isConnected = false;
  });
};

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rite-of-way';
  const localFallbackUri = 'mongodb://127.0.0.1:27017/rite-of-way';

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 100,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    } as mongoose.ConnectOptions);

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    setupConnectionEvents();
  } catch (error) {
    console.warn(`⚠️  Failed to connect to primary MongoDB cluster (${uri.split('@')[1] || uri}):`, (error as Error).message);

    if (uri !== localFallbackUri) {
      try {
        console.log(`Trying fallback to local MongoDB database (${localFallbackUri})...`);
        const conn = await mongoose.connect(localFallbackUri, {
          maxPoolSize: 100,
          minPoolSize: 10,
          socketTimeoutMS: 45000,
          serverSelectionTimeoutMS: 3000,
        } as mongoose.ConnectOptions);

        isConnected = true;
        console.log(`✅ Connected to fallback local MongoDB: ${conn.connection.host}`);
        setupConnectionEvents();
        return;
      } catch (localError) {
        console.error('❌ Failed to connect to fallback local MongoDB:', (localError as Error).message);
      }
    }

    console.error('❌ Database connection failed. Running server in offline-database mode.');
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('🔌 MongoDB disconnected');
};
