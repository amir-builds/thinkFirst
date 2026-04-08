import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function sendStudentOTPEmail(email, otp, name) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify Your Email - ThinkFirst",
    text: `Hi ${name}, your verification code is: ${otp}. Valid for 10 minutes.`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 0; max-width: 520px; margin: 40px auto; background: #080810; border-radius: 12px; overflow: hidden; border: 1px solid rgba(232, 197, 71, 0.3);">
        <div style="background: linear-gradient(135deg, #1a1a2e, #080810); padding: 32px 32px 20px;">
          <div style="width: 40px; height: 40px; border-radius: 8px; background: #e8c547; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="font-size: 18px; font-weight: 700; color: #080810; font-family: monospace;">TF</span>
          </div>
          <h2 style="color: #e8e8f0; margin: 0 0 8px 0; font-size: 22px;">Verify Your Email</h2>
          <p style="color: #9090a8; margin: 0; font-size: 14px;">Hi ${name}, use the code below to complete your registration.</p>
        </div>
        <div style="padding: 28px 32px; text-align: center;">
          <div style="background: rgba(232, 197, 71, 0.08); border: 1px solid rgba(232, 197, 71, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #e8c547; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
          <p style="color: #9090a8; font-size: 13px; margin: 0;">This code expires in <strong style="color: #e8e8f0;">10 minutes</strong>.</p>
        </div>
        <div style="padding: 16px 32px 24px; border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="color: #606078; font-size: 11px; margin: 0;">If you did not create a ThinkFirst account, you can safely ignore this email.</p>
        </div>
      </div>
    `
  });
}
