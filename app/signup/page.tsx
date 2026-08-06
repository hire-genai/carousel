import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import OtpForm from "@/components/auth/OtpForm";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Enter your email to get started. No password needed."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
            Log in →
          </Link>
        </>
      }
    >
      <OtpForm mode="signup" next={searchParams.next} />
    </AuthShell>
  );
}
