import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import Student from "../models/student.model.js";

export const verifyStudentJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.studentToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized - No token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentInstance = new Student(req.app.locals.db);
    const student = await studentInstance.findById(decoded.id);

    if (!student) {
      throw new ApiError(401, "Invalid token - Student not found");
    }

    req.student = student;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error.name === "JsonWebTokenError") {
      next(new ApiError(401, "Invalid token"));
    } else if (error.name === "TokenExpiredError") {
      next(new ApiError(401, "Token expired"));
    } else {
      next(error);
    }
  }
};

export const verifyStudentOptional = async (req, res, next) => {
  try {
    const token =
      req.cookies?.studentToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const studentInstance = new Student(req.app.locals.db);
      const student = await studentInstance.findById(decoded.id);
      if (student) {
        req.student = student;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  next();
};
