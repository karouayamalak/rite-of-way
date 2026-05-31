import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Rite of Way <noreply@riteofway.dz>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${options.to}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    console.log(`📬 [DEV EMAIL LOG] To: ${options.to}\nSubject: ${options.subject}\nHTML Content:\n${options.html}\n----------------------------------------`);
    throw new Error('Failed to send email');
  }
};

// ─── Email Templates ────────────────────────────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; }
    .header { background: #000; padding: 30px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 300; letter-spacing: 3px; margin: 0; }
    .body { padding: 40px; }
    .body p { color: #444; line-height: 1.7; font-size: 15px; }
    .btn { display: inline-block; background: #000; color: #fff; padding: 14px 32px; text-decoration: none; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin: 20px 0; }
    .footer { border-top: 1px solid #eee; padding: 24px 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>RITE OF WAY</h1></div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} Rite of Way. All rights reserved.</div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify Your Email — Rite of Way',
    html: baseTemplate(`
      <p>Hello ${name},</p>
      <p>Welcome to Rite of Way. Please verify your email address to complete your registration.</p>
      <a href="${verifyUrl}" class="btn">Verify Email</a>
      <p style="color:#999;font-size:13px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    `),
  });
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset Your Password — Rite of Way',
    html: baseTemplate(`
      <p>Hello ${name},</p>
      <p>You requested a password reset. Click the button below to set a new password.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p style="color:#999;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `),
  });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  name: string,
  orderNumber: string,
  total: number
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: `Order Confirmed #${orderNumber} — Rite of Way`,
    html: baseTemplate(`
      <p>Hello ${name},</p>
      <p>Your order <strong>#${orderNumber}</strong> has been confirmed.</p>
      <p>Total: <strong>${total.toLocaleString('fr-DZ')} DA</strong> (Cash on Delivery)</p>
      <p>We will contact you to arrange delivery. Thank you for shopping with Rite of Way.</p>
      <a href="${process.env.CLIENT_URL}/my-orders" class="btn">Track Your Order</a>
    `),
  });
};
