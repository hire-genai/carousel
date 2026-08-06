import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PostEditorClient from "./PostEditorClient";

export const metadata = { title: "New Post — SkygenAI" };

export default async function NewPostPage({ searchParams }: { searchParams: { id?: string } }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const [account, existingPost] = await Promise.all([
    prisma.linkedInAccount.findUnique({ where: { userId: session.userId } }),
    searchParams.id
      ? prisma.textPost.findFirst({
          where: { id: searchParams.id, userId: session.userId },
          select: { id: true, content: true, status: true, imageData: true, scheduledAt: true },
        })
      : null,
  ]);

  const connected = !!account && new Date(account.expiresAt) > new Date();

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] bg-[#0f0f13]">
      <PostEditorClient
        linkedinConnected={connected}
        linkedinName={account?.displayName ?? ""}
        linkedinUrn={account?.linkedinUrn ?? ""}
        initialPost={existingPost ? {
          id: existingPost.id,
          content: existingPost.content,
          status: existingPost.status,
          imageData: existingPost.imageData ?? null,
          scheduledAt: existingPost.scheduledAt?.toISOString() ?? null,
        } : null}
      />
    </div>
  );
}
