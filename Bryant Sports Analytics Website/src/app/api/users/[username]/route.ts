import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const decoded = decodeURIComponent(username);

    // Search by name or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: decoded, mode: "insensitive" } },
          { email: { equals: decoded, mode: "insensitive" } },
        ],
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
        createdAt: true,
        projects: {
          where: { visibility: "PUBLIC" },
          select: {
            id: true,
            title: true,
            slug: true,
            abstract: true,
            sport: true,
            views: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        certifications: {
          select: {
            id: true,
            name: true,
            provider: true,
            completedAt: true,
            verificationUrl: true,
          },
          orderBy: { completedAt: "desc" },
        },
        _count: {
          select: { reviewsGiven: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Users/[username] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
