import axios from "axios";
import Student from "../models/student.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import redisClient from "../utils/redisClient.js";
import { sendStudentOTPEmail } from "../mails/sendStudentOTP.js";

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3000";

const sanitizeStudent = (student) => {
  if (!student) return student;
  const { passwordHash, ...safe } = student;
  return safe;
};

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const getOAuthStateCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 10 * 60 * 1000,
});

const generateToken = (student) => {
  return jwt.sign(
    { id: student.id, email: student.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const setAuthCookie = (res, token) => {
  res.cookie("studentToken", token, getAuthCookieOptions());
};

const clearAuthCookies = (res) => {
  res.clearCookie("studentToken", getAuthCookieOptions());
  res.clearCookie("studentOAuthState", getOAuthStateCookieOptions());
};

const clearOAuthStateCookie = (res) => {
  res.clearCookie("studentOAuthState", getOAuthStateCookieOptions());
};

const getProviderConfig = (provider) => {
  const providerConfigs = {
    google: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      profileUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      scope: ["openid", "email", "profile"],
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    github: {
      authUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      profileUrl: "https://api.github.com/user",
      emailsUrl: "https://api.github.com/user/emails",
      scope: ["read:user", "user:email"],
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL,
    },
  };

  const providerConfig = providerConfigs[provider];

  if (!providerConfig) {
    throw new ApiError(400, "Unsupported OAuth provider");
  }

  if (!providerConfig.clientId || !providerConfig.clientSecret || !providerConfig.callbackUrl) {
    throw new ApiError(500, `${provider} OAuth is not configured`);
  }

  return providerConfig;
};

const createOAuthState = () => crypto.randomBytes(32).toString("hex");

const buildFrontendRedirectUrl = (path) => new URL(path, getFrontendUrl()).toString();

const buildProviderAuthorizationUrl = (provider) => {
  const config = getProviderConfig(provider);
  const state = createOAuthState();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    scope: config.scope.join(" "),
    state,
  });

  if (provider === "google") {
    params.set("access_type", "online");
    params.set("prompt", "select_account");
    params.set("include_granted_scopes", "true");
  }

  return {
    url: `${config.authUrl}?${params.toString()}`,
    state,
  };
};

const exchangeOAuthCode = async (provider, code) => {
  const config = getProviderConfig(provider);

  if (provider === "google") {
    const tokenResponse = await axios.post(
      config.tokenUrl,
      new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.callbackUrl,
        grant_type: "authorization_code",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    return tokenResponse.data.access_token;
  }

  const tokenResponse = await axios.post(
    config.tokenUrl,
    new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
    }),
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return tokenResponse.data.access_token;
};

const fetchOAuthProfile = async (provider, accessToken) => {
  const config = getProviderConfig(provider);

  if (provider === "google") {
    const response = await axios.get(config.profileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      providerUserId: response.data.sub,
      email: response.data.email,
      name: response.data.name || response.data.email,
      profilePicture: response.data.picture || null,
      emailVerified: Boolean(response.data.email_verified),
    };
  }

  const [profileResponse, emailsResponse] = await Promise.all([
    axios.get(config.profileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "ThinkFirst-App",
      },
    }),
    axios.get(config.emailsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "ThinkFirst-App",
      },
    }),
  ]);

  const verifiedEmail =
    emailsResponse.data.find((item) => item.primary && item.verified) ||
    emailsResponse.data.find((item) => item.verified) ||
    emailsResponse.data[0];

  return {
    providerUserId: profileResponse.data.id.toString(),
    email: verifiedEmail?.email || null,
    name: profileResponse.data.name || profileResponse.data.login || verifiedEmail?.email,
    profilePicture: profileResponse.data.avatar_url || null,
    emailVerified: Boolean(verifiedEmail?.verified),
  };
};

const saveOAuthStudent = async (studentInstance, provider, profile) => {
  let student = await studentInstance.findByProviderUserId(provider, profile.providerUserId);

  if (!student) {
    student = await studentInstance.findByEmail(profile.email);

    if (student) {
      student = await studentInstance.updateOAuthProfile(student.id, {
        name: profile.name,
        profilePicture: profile.profilePicture,
        emailVerified: profile.emailVerified,
        provider,
        providerUserId: profile.providerUserId,
      });
      return student;
    }

    return studentInstance.create({
      email: profile.email,
      name: profile.name,
      provider,
      providerUserId: profile.providerUserId,
      profilePicture: profile.profilePicture,
      emailVerified: profile.emailVerified,
    });
  }

  return studentInstance.updateOAuthProfile(student.id, {
    name: profile.name,
    profilePicture: profile.profilePicture,
    emailVerified: profile.emailVerified,
    provider,
    providerUserId: profile.providerUserId,
  });
};

// Register with email/password
export const studentRegister = asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    throw new ApiError(400, "Email, name, and password are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const studentInstance = new Student(req.app.locals.db);
  const existingStudent = await studentInstance.findByEmail(email);

  if (existingStudent) {
    throw new ApiError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const student = await studentInstance.create({
    email,
    name,
    passwordHash,
    provider: "local",
    emailVerified: false,
  });

  const otp = crypto.randomInt(100000, 999999).toString();
  await redisClient.setEx(`studentOTP:${email}`, 600, otp);

  try {
    await sendStudentOTPEmail(email, otp, name);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    // Don't fail registration if email fails, but they will need to resend
  }

  return res.status(201).json(
    new ApiResponse(201, { needsVerification: true, email }, "Registration successful. Please verify your email.")
  );
});

export const verifyStudentEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const storedOtp = await redisClient.get(`studentOTP:${email}`);

  if (!storedOtp || storedOtp !== otp) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const studentInstance = new Student(req.app.locals.db);
  const student = await studentInstance.findByEmail(email);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Update student as verified
  await studentInstance.db.execute("UPDATE students SET emailVerified = TRUE WHERE id = ?", [student.id]);
  student.emailVerified = true; // Update local object for response

  // Clear OTP
  await redisClient.del(`studentOTP:${email}`);

  const token = generateToken(student);
  setAuthCookie(res, token);

  return res.json(
    new ApiResponse(200, { student: sanitizeStudent(student), token }, "Email verified successfully")
  );
});

export const resendStudentOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const studentInstance = new Student(req.app.locals.db);
  const student = await studentInstance.findByEmail(email);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (student.emailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  await redisClient.setEx(`studentOTP:${email}`, 600, otp);

  try {
    await sendStudentOTPEmail(email, otp, student.name);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    throw new ApiError(500, "Failed to send verification email");
  }

  return res.json(
    new ApiResponse(200, null, "Verification email resent")
  );
});

// Local login with email/password
export const studentLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const studentInstance = new Student(req.app.locals.db);
  const student = await studentInstance.findByEmail(email);

  if (!student || !student.passwordHash) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, student.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!student.emailVerified) {
    throw new ApiError(403, "Please verify your email to login.");
  }

  const token = generateToken(student);

  setAuthCookie(res, token);

  return res.json(
    new ApiResponse(200, { student: sanitizeStudent(student), token }, "Login successful")
  );
});

export const startStudentOAuth = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { url, state } = buildProviderAuthorizationUrl(provider);

  res.cookie("studentOAuthState", state, getOAuthStateCookieOptions());
  return res.redirect(url);
});

export const handleStudentOAuthCallback = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;
    const cookieState = req.cookies?.studentOAuthState;

    if (error) {
      throw new ApiError(400, `OAuth provider returned an error: ${error}`);
    }

    if (!code || !state) {
      throw new ApiError(400, "Missing OAuth callback parameters");
    }

    if (!cookieState || cookieState !== state) {
      throw new ApiError(400, "Invalid OAuth state");
    }

    const accessToken = await exchangeOAuthCode(provider, code);
    const profile = await fetchOAuthProfile(provider, accessToken);

    if (!profile.email) {
      throw new ApiError(400, "OAuth provider did not return an email address");
    }

    const studentInstance = new Student(req.app.locals.db);
    const student = await saveOAuthStudent(studentInstance, provider, profile);
    const token = generateToken(student);

    setAuthCookie(res, token);
    clearOAuthStateCookie(res);

    return res.redirect(buildFrontendRedirectUrl("/student/dashboard"));
  } catch (error) {
    console.error("OAuth callback error:", error);
    clearOAuthStateCookie(res);

    const message = encodeURIComponent(
      error instanceof ApiError ? error.message : "OAuth login failed"
    );

    return res.redirect(buildFrontendRedirectUrl(`/student/login?error=${message}`));
  }
};

// Get current student
export const getCurrentStudent = asyncHandler(async (req, res) => {
  const student = req.student;
  
  if (!student) {
    throw new ApiError(401, "Not authenticated");
  }

  const studentInstance = new Student(req.app.locals.db);
  const stats = await studentInstance.getStudentStats(student.id);

  return res.json(
    new ApiResponse(200, { student: sanitizeStudent(student), stats }, "Student retrieved successfully")
  );
});

// Logout student
export const studentLogout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  return res.json(new ApiResponse(200, null, "Logout successful"));
});

// Update student profile
export const updateStudentProfile = asyncHandler(async (req, res) => {
  const { name, bio } = req.body;
  const studentId = req.student.id;

  const studentInstance = new Student(req.app.locals.db);
  
  await studentInstance.db.execute(
    "UPDATE students SET name = ?, bio = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
    [name || req.student.name, bio, studentId]
  );

  const updatedStudent = await studentInstance.findById(studentId);

  return res.json(
    new ApiResponse(200, updatedStudent, "Profile updated successfully")
  );
});
