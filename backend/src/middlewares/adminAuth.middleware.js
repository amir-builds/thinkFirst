import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import Admin from "../models/admin.model.js";

export const verifyAdminJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.adminToken || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminInstance = new Admin(req.app.locals.db);
    const admin = await adminInstance.findById(decoded.id);

    if (!admin) {
      throw new ApiError(401, "Invalid token");
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};
