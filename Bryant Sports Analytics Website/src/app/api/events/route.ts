import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        endTime: { gte: new Date() },
      },
      include: {
        _count: {
          select: { rsvps: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Events GET error:", error);
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

    // Only FACULTY or ADMIN can create events
    if (session.user.role !== "FACULTY" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only faculty and admins can create events" },
        { status: 403 }
      );
    }

    const { title, description, type, location, startTime, endTime } =
      await req.json();

    if (!title || !type || !startTime || !endTime) {
      return NextResponse.json(
        { error: "title, type, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        type,
        location: location || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Events POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
