"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  mode: "login" | "signup";
  next?: string;
}

export default function OtpForm({ mode, next }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send code.");
      } else {
        setStep("otp");
        if (data.devOtp) setDevOtp(data.devOtp);
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, mode, next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code.");
      } else {
        router.push(data.redirect || "/dashboard");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={sendOtp} className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-2">
            Email
          </label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition text-sm"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 transition shadow-lg shadow-blue-500/20"
        >
          {loading ? "Sending code..." : "Send verification code →"}
        </button>

        <p className="text-center text-xs text-white/30 pt-1">
          We&apos;ll email you a 6-digit code. No password needed.
        </p>
      </form>
    );
  }

  // OTP step
  return (
    <form onSubmit={verifyOtp} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
            Verification Code
          </label>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
              setDevOtp(null);
            }}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            ← Change email
          </button>
        </div>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition text-center font-mono text-2xl tracking-[0.5em]"
        />
        <p className="text-xs text-white/40 mt-2">
          Sent to <span className="text-white/70 font-medium">{email}</span>
        </p>
      </div>

      {devOtp && process.env.NODE_ENV === "development" && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          <span className="font-bold">DEV:</span> Your code is{" "}
          <span className="font-mono text-sm">{devOtp}</span>
          <p className="text-amber-300/60 mt-1">(shown only in development)</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 transition shadow-lg shadow-blue-500/20"
      >
        {loading ? "Verifying..." : "Verify & continue →"}
      </button>

      <button
        type="button"
        onClick={() => sendOtp()}
        disabled={loading}
        className="w-full py-2 text-xs text-white/50 hover:text-white transition"
      >
        Didn&apos;t get it? Resend code
      </button>
    </form>
  );
}
