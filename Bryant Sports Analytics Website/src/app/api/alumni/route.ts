import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get("sport");
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      role: "ALUMNI",
    };

    // Build filters for sport (search in bio or headline) and search
    const andConditions = [];

    if (sport) {
      andConditions.push({
        OR: [
          { bio: { contains: sport, mode: "insensitive" as const } },
          { headline: { contains: sport, mode: "insensitive" as const } },
        ],
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { headline: { contains: search, mode: "insensitive" as const } },
          { bio: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const alumni = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        image: true,
        headline: true,
        bio: true,
        classYear: true,
        concentration: true,
        linkedinUrl: true,
        githubUrl: true,
        personalUrl: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(alumni);
  } catch (error) {
    console.error("Alumni GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
