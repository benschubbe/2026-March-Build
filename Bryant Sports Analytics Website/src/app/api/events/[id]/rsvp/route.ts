import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check for existing RSVP
    const existing = await prisma.eventRsvp.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    if (existing) {
      // Toggle off: remove RSVP
      await prisma.eventRsvp.delete({ where: { id: existing.id } });
      return NextResponse.json({ rsvped: false });
    } else {
      // Toggle on: create RSVP
      await prisma.eventRsvp.create({
        data: {
          userId: session.user.id,
          eventId,
        },
      });
      return NextResponse.json({ rsvped: true }, { status: 201 });
    }
  } catch (error) {
    console.error("RSVP toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
