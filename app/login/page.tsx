import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import OtpForm from "@/components/auth/OtpForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Enter your email to receive a login code"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
            Sign up free →
          </Link>
        </>
      }
    >
      <OtpForm mode="login" next={searchParams.next} />
    </AuthShell>
  );
}
