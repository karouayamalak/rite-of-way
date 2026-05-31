import mongoose from 'mongoose';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('📦 MongoDB already connected');
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rite-of-way';

  try {
    const conn = await mongoose.connect(uri, {
      bufferCommands: false,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('🔌 MongoDB disconnected');
};
