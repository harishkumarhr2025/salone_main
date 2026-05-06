import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user", "semi_admin", "semi admin", "salonfrontoffice"],
      default: "user",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    next();
  }
});

userSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error("Password Comparison Error:", error);
    throw new Error("Error comparing passwords");
  }
};

userSchema.methods.generateToken = async function (expireTime) {
  try {
    return jwt.sign(
      {
        userId: this._id.toString(),
        email: this.email,
        // isAdmin: this.isAdmin,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: expireTime,
      }
    );
  } catch (error) {
    console.log(error.message);
  }
};

const User = mongoose.model("user", userSchema);
export default User;
