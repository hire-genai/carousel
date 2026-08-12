import crypto from "crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "./prisma";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;

export function generateOtp(): string {
  return Array.from({ length: OTP_LENGTH }, () =>
    crypto.randomInt(0, 10).toString()
  ).join("");
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function createOtp(email: string, purpose: "login" | "signup") {
  const code = generateOtp();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate previous unused OTPs for this email
  await prisma.otpCode.updateMany({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  await prisma.otpCode.create({
    data: { email, codeHash, purpose, expiresAt },
  });

  return code;
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const codeHash = hashOtp(code);

  const otp = await prisma.otpCode.findFirst({
    where: {
      email,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  return true;
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

function otpEmailHtml(code: string, purpose: string, ttlMin: number): string {
  const action = purpose === "signup" ? "complete your sign up" : "log in";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="font-size:20px;font-weight:600;color:#111827;padding-bottom:8px;">Your verification code</td></tr>
        <tr><td style="font-size:14px;color:#4b5563;line-height:1.5;padding-bottom:24px;">Use the code below to ${action}. This code expires in ${ttlMin} minutes.</td></tr>
        <tr><td align="center" style="padding:16px 0 24px 0;">
          <div style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:700;color:#111827;background:#f3f4f6;border-radius:8px;padding:14px 24px;">${code}</div>
        </td></tr>
        <tr><td style="font-size:12px;color:#9ca3af;line-height:1.5;">If you didn't request this, you can safely ignore this email.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function deliverOtp(email: string, code: string, purpose: string) {
  const transporter = getTransporter();
  if (!transporter) {
    const line = `[OTP] ${purpose.toUpperCase()} code for ${email} = ${code} (valid ${OTP_TTL_MINUTES} min) — SMTP not configured, logged only`;
    console.log("\n" + "═".repeat(60));
    console.log(line);
    console.log("═".repeat(60) + "\n");
    return;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER!;
  const subject =
    purpose === "signup"
      ? `${code} is your HireGenAI sign-up code`
      : `${code} is your HireGenAI login code`;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      text: `Your ${purpose} code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      html: otpEmailHtml(code, purpose, OTP_TTL_MINUTES),
    });
  } catch (err) {
    console.error("[otp] Failed to send email:", err);
    throw new Error("Failed to send verification email. Please try again.");
  }
}
