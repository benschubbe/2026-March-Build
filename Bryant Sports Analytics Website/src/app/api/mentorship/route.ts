import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matches = await prisma.mentorMatch.findMany({
      where: {
        OR: [
          { mentorId: session.user.id },
          { menteeId: session.user.id },
        ],
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
            role: true,
          },
        },
        mentee: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Mentorship GET error:", error);
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

    const { mentorId } = await req.json();

    if (!mentorId) {
      return NextResponse.json(
        { error: "mentorId is required" },
        { status: 400 }
      );
    }

    if (mentorId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot mentor yourself" },
        { status: 400 }
      );
    }

    // Verify mentor exists
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
    });
    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor not found" },
        { status: 404 }
      );
    }

    // Check for existing match
    const existing = await prisma.mentorMatch.findFirst({
      where: {
        mentorId,
        menteeId: session.user.id,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A mentorship request already exists with this mentor" },
        { status: 409 }
      );
    }

    const match = await prisma.mentorMatch.create({
      data: {
        mentorId,
        menteeId: session.user.id,
      },
      include: {
        mentor: {
          select: { id: true, name: true, image: true, headline: true },
        },
        mentee: {
          select: { id: true, name: true, image: true, headline: true },
        },
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("Mentorship POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
