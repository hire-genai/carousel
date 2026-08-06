import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/dashboard/Sidebar";
import OnboardingModal from "@/components/OnboardingModal";
import { ToastContainer } from "@/components/ToastNotification";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Show onboarding for accounts created in the last 5 minutes.
  // The modal itself still checks localStorage so it only displays once.
  const isNewUser =
    user.createdAt.getTime() > Date.now() - 5 * 60 * 1000;

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex">
      <Sidebar
        userEmail={user.email}
        linkedinConnected={!!user.linkedinAccount}
      />
      <main className="flex-1 min-w-0">{children}</main>
      {isNewUser && <OnboardingModal />}
      <ToastContainer />
    </div>
  );
}
