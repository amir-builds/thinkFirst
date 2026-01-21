import nodemailer from "nodemailer";

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function sendAdminOTPEmail(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Admin Login OTP - ThinkFirst",
    text: `Your OTP is: ${otp}. Valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
        <h2 style="color: #333;">ThinkFirst Admin Login</h2>
        <p>Your OTP for admin login is:</p>
        <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
        <p style="color: #666;">This OTP is valid for 5 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `
  });
}
