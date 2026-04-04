import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
            linkedinUrl: true,
            githubUrl: true,
          },
        },
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
            replies: {
              include: {
                author: {
                  select: { id: true, name: true, image: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        tags: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    if (existing.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the author can edit this project" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      abstract,
      content,
      methodology,
      sport,
      technique,
      tools,
      domain,
      visibility,
      githubUrl,
      tableauUrl,
      videoUrl,
      openForReview,
    } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(abstract !== undefined && { abstract }),
        ...(content !== undefined && { content }),
        ...(methodology !== undefined && { methodology }),
        ...(sport !== undefined && { sport }),
        ...(technique !== undefined && { technique }),
        ...(tools !== undefined && { tools }),
        ...(domain !== undefined && { domain }),
        ...(visibility !== undefined && { visibility }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(tableauUrl !== undefined && { tableauUrl }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(openForReview !== undefined && { openForReview }),
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    if (existing.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the author can delete this project" },
        { status: 403 }
      );
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
