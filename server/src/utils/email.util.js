import transporter from "../configs/nodemailer.config.js";

const BRAND_NAME = process.env.EMAIL_BRAND_NAME || "PrimeTrade";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || "support@example.com";
const DISPLAY_TIMEZONE = process.env.DISPLAY_TIMEZONE || "Asia/Kolkata";

const baseStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      line-height: 1.6;
      color: #333;
      padding: 20px 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .header {
      background: linear-gradient(135deg, #CC2B52 0%, #B02547 100%);
      color: #ffffff;
      text-align: center;
      padding: 40px 30px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      line-height: 1.3;
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
      margin: 0;
    }
    .content { padding: 40px 30px; color: #1f2937; }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      background: #CC2B52;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 10px 0;
    }
    .info-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
      border-left: 4px solid #CC2B52;
    }
    .warning {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      color: #92400e;
      text-align: center;
    }
    @media only screen and (max-width: 600px) {
      .email-container { margin: 10px; border-radius: 12px; }
      .header { padding: 30px 20px; }
      .header h1 { font-size: 24px; }
      .content, .footer { padding: 25px 20px; }
    }
  </style>
`;

const formatInDisplayTZ = (date, options = {}) => {
  const d = date instanceof Date ? date : new Date(date);
  const opts = Object.keys(options).length
    ? options
    : { dateStyle: "full", timeStyle: "short" };
  return new Intl.DateTimeFormat("en-IN", {
    ...opts,
    timeZone: DISPLAY_TIMEZONE,
  }).format(d);
};

export const verificationOtpTemplate = (otp, expiresMinutes = 10) => `
<!DOCTYPE html>
<html>
<head>
  <title>Email Verification - ${BRAND_NAME}</title>
  ${baseStyles}
  <style>
    .otp-display {
      font-size: 42px;
      font-weight: 800;
      color: #CC2B52;
      letter-spacing: 8px;
      margin: 25px 0;
      text-align: center;
      background: #fef3f3;
      padding: 20px;
      border-radius: 12px;
      border: 2px dashed #CC2B52;
    }
    .instruction { text-align: center; color: #6b7280; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Verify Your Email</h1>
      <p>Welcome to ${BRAND_NAME}! Let's secure your account</p>
    </div>
    <div class="content">
      <p style="font-size:16px; margin-bottom:20px;">Hi there,</p>
      <p style="margin-bottom:25px;">
        Use the OTP below to verify your email and complete your account setup.
      </p>
      <div class="otp-display">${otp}</div>
      <div class="instruction">Enter this code in the verification screen to continue.</div>
      <div class="warning">
        <strong>Important:</strong> This OTP expires in ${expiresMinutes} minutes.
      </div>
      <p>If you did not request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p style="margin:0 0 10px 0; font-weight:600;">${BRAND_NAME}</p>
      <p style="margin:0 0 10px 0;">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#CC2B52; text-decoration:none;">${SUPPORT_EMAIL}</a></p>
      <p style="margin:0; font-size:12px; color:#9ca3af;">Sent at ${formatInDisplayTZ(new Date())}</p>
    </div>
  </div>
</body>
</html>`;

export const passwordResetTemplate = (resetToken, expiresMinutes = 15) => `
<!DOCTYPE html>
<html>
<head>
  <title>Reset Password - ${BRAND_NAME}</title>
  ${baseStyles}
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Reset Your Password</h1>
      <p>Secure your ${BRAND_NAME} account</p>
    </div>
    <div class="content">
      <p style="font-size:16px; margin-bottom:20px;">Hello,</p>
      <p style="margin-bottom:20px;">
        We received a request to reset your password. Use this reset token:
      </p>
      <div class="info-card" style="text-align:center;">
        <p style="font-size:30px; font-weight:800; color:#CC2B52; letter-spacing:2px;">${resetToken}</p>
      </div>
      <div class="warning">
        <strong>Security Notice:</strong> This token expires in ${expiresMinutes} minutes.
      </div>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      <p style="margin:0 0 10px 0; font-weight:600;">${BRAND_NAME}</p>
      <p style="margin:0 0 10px 0;">Support: <a href="mailto:${SUPPORT_EMAIL}" style="color:#CC2B52; text-decoration:none;">${SUPPORT_EMAIL}</a></p>
      <p style="margin:0; font-size:12px; color:#9ca3af;">Sent at ${formatInDisplayTZ(new Date())}</p>
    </div>
  </div>
</body>
</html>`;

export const sendEmail = async ({ to, subject, text, html }) => {
  const fromName = process.env.EMAIL_FROM_NAME || BRAND_NAME;
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!fromAddress) {
    throw new Error("EMAIL_FROM or EMAIL_USER is required for sending emails.");
  }

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
};

export const sendVerificationOtpEmail = async ({ to, otp, expiresMinutes = 10 }) => {
  return sendEmail({
    to,
    subject: `Verify your email - ${BRAND_NAME}`,
    text: `Your verification OTP is ${otp}. It expires in ${expiresMinutes} minutes.`,
    html: verificationOtpTemplate(otp, expiresMinutes),
  });
};

export const sendPasswordResetEmail = async ({
  to,
  resetToken,
  expiresMinutes = 15,
}) => {
  return sendEmail({
    to,
    subject: `Reset your password - ${BRAND_NAME}`,
    text: `Your password reset token is ${resetToken}. It expires in ${expiresMinutes} minutes.`,
    html: passwordResetTemplate(resetToken, expiresMinutes),
  });
};
