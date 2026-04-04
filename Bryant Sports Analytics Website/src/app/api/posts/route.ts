import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (channelId) {
      where.channelId = channelId;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, image: true, headline: true },
        },
        reactions: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    // Aggregate reaction counts by type
    const postsWithReactionCounts = posts.map((post) => {
      const reactionCounts: Record<string, number> = {};
      for (const reaction of post.reactions) {
        reactionCounts[reaction.type] =
          (reactionCounts[reaction.type] || 0) + 1;
      }
      const { reactions: _reactions, ...rest } = post;
      return { ...rest, reactionCounts };
    });

    return NextResponse.json(postsWithReactionCounts);
  } catch (error) {
    console.error("Posts GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, channelId } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content,
        channelId: channelId || null,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Posts POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
