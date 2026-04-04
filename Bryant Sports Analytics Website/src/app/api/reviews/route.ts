import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const reviewerId = searchParams.get("reviewerId");
    const authorId = searchParams.get("authorId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (reviewerId) where.reviewerId = reviewerId;
    if (authorId) where.authorId = authorId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: { id: true, name: true, image: true },
        },
        project: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Reviews GET error:", error);
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

    const {
      projectId,
      methodologyScore,
      visualizationScore,
      writingScore,
      codeQualityScore,
      rigorScore,
      feedback,
    } = await req.json();

    if (!projectId || !feedback) {
      return NextResponse.json(
        { error: "projectId and feedback are required" },
        { status: 400 }
      );
    }

    // Look up the project to get its authorId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.authorId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot review your own project" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        projectId,
        reviewerId: session.user.id,
        authorId: project.authorId,
        methodologyScore: methodologyScore ?? 0,
        visualizationScore: visualizationScore ?? 0,
        writingScore: writingScore ?? 0,
        codeQualityScore: codeQualityScore ?? 0,
        rigorScore: rigorScore ?? 0,
        feedback,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, image: true },
        },
        project: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
