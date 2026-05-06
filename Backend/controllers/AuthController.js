import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/AuthModel.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import sendWhatsappMessage from "../utils/sendWhatsappMessage.js";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const resolveRegistrationRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "semiadmin") {
    return "semi_admin";
  }
  return "user";
};

const resolveManagedRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "admin") return "admin";
  if (normalizedRole === "semiadmin" || normalizedRole === "salonfrontoffice") return "semi_admin";
  if (normalizedRole === "user") return "user";
  return null;
};

const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please Enter required fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: resolveRegistrationRole(role),
    });
    await user.save();

    res.status(201).json({
      success: true,
      userID: user._id,
      token: await user.generateToken("30d"),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in registration:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please Enter required fields" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found." });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const whatsappMessageOptions = {
      body: `Dear ${user.name}, We are thrilled to welcome you to LikeMe family salon ! Thank you for choosing us as your destination. Have a nice day ahead`,
      to: `+91${9140091671}`,
    };

    await sendWhatsappMessage(whatsappMessageOptions);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      userId: user._id.toString(),
      token: await user.generateToken("30d"),
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
};

const loggedInUser = async (req, res) => {
  try {
    const user = req.user;
    console.log("User Controller:", user);
    return res.status(200).json({ success: true, user });
  } catch (error) {}
};

const verifyUser = async (req, res) => {
  try {
    const token = req.header("Authorization");
    const user = await verifyToken(token);

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

const getAllUsersForRoleManagement = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const nextRole = resolveManagedRole(req.body?.role);

    if (!nextRole) {
      return res.status(400).json({
        success: false,
        message: "Role must be one of admin, semi_admin, or user",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = nextRole;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: error.message,
    });
  }
};

export {
  register,
  login,
  loggedInUser,
  verifyUser,
  getAllUsersForRoleManagement,
  updateUserRole,
};
