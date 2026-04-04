import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    const certification = await prisma.certification.findUnique({
      where: { id },
    });

    if (!certification) {
      return NextResponse.json(
        { error: "Certification not found" },
        { status: 404 }
      );
    }

    if (certification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can delete this certification" },
        { status: 403 }
      );
    }

    await prisma.certification.delete({ where: { id } });

    return NextResponse.json({ message: "Certification deleted" });
  } catch (error) {
    console.error("Certification DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
