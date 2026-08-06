import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CarouselGeneratorClient from "./CarouselGeneratorClient";

export const metadata = { title: "Create Carousel — SkygenAI" };

export default async function NewCarouselPage({ searchParams }: { searchParams: { template?: string; id?: string } }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const [account, existingCarousel] = await Promise.all([
    prisma.linkedInAccount.findUnique({
      where: { userId: session.userId },
      select: { displayName: true, linkedinUrn: true, expiresAt: true },
    }),
    searchParams.id
      ? prisma.carousel.findFirst({ where: { id: searchParams.id, userId: session.userId } })
      : null,
  ]);

  const linkedinConnected = !!account && new Date(account.expiresAt) > new Date();

  return (
    <CarouselGeneratorClient
      linkedinConnected={linkedinConnected}
      linkedinName={account?.displayName ?? ""}
      templateId={searchParams.template}
      initialSlidesJson={existingCarousel?.slides ?? undefined}
      initialSavedId={existingCarousel?.id ?? undefined}
    />
  );
}
