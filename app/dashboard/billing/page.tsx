import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BillingPage from "./BillingPage";

type Plan = "free" | "pro" | "business";

export default async function BillingRoute({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; demo?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  const rawPlan = subscription?.plan ?? "free";
  const currentPlan: Plan = ["free", "pro", "business"].includes(rawPlan)
    ? (rawPlan as Plan)
    : "free";

  const hasStripeCustomer = !!subscription?.stripeCustomerId;

  const params = await searchParams;

  return (
    <BillingPage
      currentPlan={currentPlan}
      hasStripeCustomer={hasStripeCustomer}
      searchParams={params}
    />
  );
}
