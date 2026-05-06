import mongoose from "mongoose";

const connectDB = async (url) => {
  try {
    mongoose.connect(url);
    console.log("DB connected..");
  } catch (error) {
    console.log("Error in database connection");
  }
};

export default connectDB;
