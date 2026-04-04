import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Active challenges first, then past by date descending
    const active = await prisma.challenge.findMany({
      where: { active: true },
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: { endDate: "asc" },
    });

    const past = await prisma.challenge.findMany({
      where: { active: false },
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: { endDate: "desc" },
    });

    return NextResponse.json([...active, ...past]);
  } catch (error) {
    console.error("Challenges GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
