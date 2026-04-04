import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const certifications = await prisma.certification.findMany({
      where: { userId: session.user.id },
      orderBy: { completedAt: "desc" },
    });

    return NextResponse.json(certifications);
  } catch (error) {
    console.error("Certifications GET error:", error);
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

    const { name, provider, completedAt, verificationUrl } = await req.json();

    if (!name || !provider || !completedAt) {
      return NextResponse.json(
        { error: "name, provider, and completedAt are required" },
        { status: 400 }
      );
    }

    const certification = await prisma.certification.create({
      data: {
        name,
        provider,
        completedAt: new Date(completedAt),
        verificationUrl: verificationUrl || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error("Certifications POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
