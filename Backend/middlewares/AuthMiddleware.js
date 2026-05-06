import jwt from "jsonwebtoken";
import User from "../models/AuthModel.js";

const AuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    // Use the verifyToken helper
    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

const verifyToken = async (token) => {
  try {
    if (!token || !token.startsWith("Bearer ")) return null;

    const jwtToken = token?.split(" ")[1];
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);

    // Use findById by userId
    const user = await User.findById(decoded.userId).select("-password");

    return user;
  } catch (error) {
    console.error("Token verification error:", error);
    return null; // Don't send response here
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this action",
      });
    }

    next();
  };
};

export { AuthMiddleware, verifyToken, authorizeRoles };

// const AuthMiddleware = async (req, res, next) => {
//   const token = req.header("Authorization");
//   console.log(("Token:", token));
//   if (!token) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Token not provided" });
//   }

//   const jwtToken = token.startsWith("Bearer ") ? token.split(" ")[1] : null;

//   console.log("Jwt Token:", jwtToken);

//   if (!jwtToken) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Invalid token format" });
//   }

//   try {
//     const isVerified = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);

//     const userData = await User.findOne({ email: isVerified.email });

//     if (!userData) {
//       return res
//         .status(401)
//         .json({ success: false, message: "User not found" });
//     }

//     req.user = userData;
//     req.token = userData.token;
//     req.userId = userData._id.toString();

//     next();
//   } catch (error) {
//     let message = "Invalid token";

//     if (error instanceof jwt.TokenExpiredError) {
//       message = "Token expired";
//     } else if (error instanceof jwt.JsonWebTokenError) {
//       message = "Invalid token";
//     }
//     return res.status(401).send({ success: false, message });
//   }
// };

// const verifyToken = async (token) => {
//   try {
//     if (!token || !token.startsWith("Bearer ")) return null;

//     const jwtToken = token.split(" ")[1];
//     const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
//     console.log("decoded:", decoded);
//     const user = await User.findById(decoded.id).select("-password");
//     if (!user) return null;

//     return user;
//   } catch (error) {
//     console.error("User verify error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify the user.",
//     });
//   }
// };

// export { AuthMiddleware, verifyToken };
