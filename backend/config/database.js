import mongoose from "mongoose";

const connectDB = async () => {
 try {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
   maxPoolSize: 10,
   serverSelectionTimeoutMS: 50000,
   socketTimeoutMS: 45000,
  });

  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
 } catch (error) {
  console.error("❌ Database connection error:", error);
  process.exit(1);
 }
};

export default connectDB;
