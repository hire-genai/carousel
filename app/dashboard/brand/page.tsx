import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BrandKitEditor from "./BrandKitEditor";
import type { BrandKitData, FontFamily } from "@/lib/types";

export default async function BrandPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  let brandKit = await prisma.brandKit.findUnique({
    where: { userId: session.userId },
  });

  if (!brandKit) {
    brandKit = await prisma.brandKit.create({
      data: { userId: session.userId },
    });
  }

  const initialData: BrandKitData = {
    logoData: brandKit.logoData,
    colors: JSON.parse(brandKit.colors) as string[],
    headingFont: brandKit.headingFont as FontFamily,
    bodyFont: brandKit.bodyFont as FontFamily,
    accentColor: brandKit.accentColor,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-[11px] text-white/30 uppercase tracking-widest font-medium mb-1">
          Brand Kit
        </p>
        <h1 className="text-3xl font-black tracking-tight">Your Brand Kit</h1>
        <p className="text-white/40 text-sm mt-1">
          Logo, colors, and fonts — applied automatically across every carousel you create
        </p>
      </div>
      <BrandKitEditor initialData={initialData} />
    </div>
  );
}
