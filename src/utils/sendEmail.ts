import nodemailer from "nodemailer";

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  const mailUser = process.env.MAIL_USER?.trim();
  const mailPass = process.env.MAIL_PASS?.replace(/\s+/g, "");

  if (!mailUser || !mailPass) {
    throw new Error("MAIL_USER or MAIL_PASS is missing in environment variables");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  });

  const info = await transporter.sendMail({
    from: `"Medident Support" <${mailUser}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  return info;
};