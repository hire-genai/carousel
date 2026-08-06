import crypto from "crypto";
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

// In dev, log the OTP to console. In production, send via email/SMS.
export function deliverOtp(email: string, code: string, purpose: string) {
  const line = `[OTP] ${purpose.toUpperCase()} code for ${email} = ${code} (valid ${OTP_TTL_MINUTES} min)`;
  console.log("\n" + "═".repeat(60));
  console.log(line);
  console.log("═".repeat(60) + "\n");
}
