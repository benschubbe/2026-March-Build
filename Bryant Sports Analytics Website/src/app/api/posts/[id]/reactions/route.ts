import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const VALID_TYPES = ["UPVOTE", "INSIGHTFUL", "FIRE", "CLAP"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const { type } = await req.json();

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type. Must be one of: " + VALID_TYPES.join(", ") },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check for existing reaction by this user on this post
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existing) {
      // Toggle off: delete the reaction
      await prisma.reaction.delete({ where: { id: existing.id } });
    } else {
      // Create new reaction
      await prisma.reaction.create({
        data: {
          type,
          userId: session.user.id,
          postId,
        },
      });
    }

    // Return updated reaction counts
    const reactions = await prisma.reaction.findMany({
      where: { postId },
    });

    const reactionCounts: Record<string, number> = {};
    for (const r of reactions) {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    }

    return NextResponse.json({ reactionCounts });
  } catch (error) {
    console.error("Reaction toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
