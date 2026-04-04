import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error("Channels GET error:", error);
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

    // Only FACULTY or ADMIN can create channels
    if (session.user.role !== "FACULTY" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only faculty and admins can create channels" },
        { status: 403 }
      );
    }

    const { name, description, sport, type } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.channel.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "A channel with this name already exists" },
        { status: 409 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        description: description || null,
        sport: sport || null,
        type: type || "GENERAL",
      },
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("Channels POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
