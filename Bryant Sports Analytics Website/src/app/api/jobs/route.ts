import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleType = searchParams.get("roleType");
    const sport = searchParams.get("sport");
    const experienceLevel = searchParams.get("experienceLevel");
    const remote = searchParams.get("remote");
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (roleType) where.roleType = roleType;
    if (sport) where.sport = { contains: sport, mode: "insensitive" };
    if (experienceLevel) where.experienceLevel = experienceLevel;
    if (remote !== null && remote !== undefined) {
      where.remote = remote === "true";
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Jobs GET error:", error);
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

    // Only ALUMNI or ADMIN can create job listings
    if (session.user.role !== "ALUMNI" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only alumni and admins can post job listings" },
        { status: 403 }
      );
    }

    const {
      title,
      company,
      description,
      sport,
      roleType,
      location,
      experienceLevel,
      remote,
      url,
      bryantConnection,
      expiresAt,
    } = await req.json();

    if (!title || !company || !description || !roleType || !experienceLevel) {
      return NextResponse.json(
        { error: "title, company, description, roleType, and experienceLevel are required" },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        title,
        company,
        description,
        sport,
        roleType,
        location,
        experienceLevel,
        remote: remote ?? false,
        url,
        postedById: session.user.id,
        bryantConnection: bryantConnection ?? false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Jobs POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
