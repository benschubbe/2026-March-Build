import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can update this application" },
        { status: 403 }
      );
    }

    const { status, notes, contactInfo, followUpDate } = await req.json();

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(contactInfo !== undefined && { contactInfo }),
        ...(followUpDate !== undefined && {
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        }),
      },
      include: {
        job: true,
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("Application PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
