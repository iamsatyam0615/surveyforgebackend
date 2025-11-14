import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI as string;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    console.error('⚠️  Server will continue running but database operations will fail');
    console.error('⚠️  Please fix your MongoDB credentials in .env file');
    // Don't exit - allow server to run without DB for debugging
  }
};

export default connectDB;
