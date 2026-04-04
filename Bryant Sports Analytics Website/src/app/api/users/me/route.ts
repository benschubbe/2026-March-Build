import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        headline: true,
        classYear: true,
        concentration: true,
        linkedinUrl: true,
        githubUrl: true,
        personalUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        projects: {
          select: {
            id: true,
            title: true,
            slug: true,
            abstract: true,
            sport: true,
            views: true,
            visibility: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        certifications: {
          orderBy: { completedAt: "desc" },
        },
        _count: {
          select: {
            reviewsGiven: true,
            posts: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Users/me GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      bio,
      headline,
      linkedinUrl,
      githubUrl,
      personalUrl,
      classYear,
      concentration,
    } = await req.json();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(headline !== undefined && { headline }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(personalUrl !== undefined && { personalUrl }),
        ...(classYear !== undefined && { classYear }),
        ...(concentration !== undefined && { concentration }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        headline: true,
        classYear: true,
        concentration: true,
        linkedinUrl: true,
        githubUrl: true,
        personalUrl: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Users/me PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
