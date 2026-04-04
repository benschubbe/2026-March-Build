import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const sport = searchParams.get("sport");
    const technique = searchParams.get("technique");
    const tool = searchParams.get("tool");
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search");
    const visibility = searchParams.get("visibility");

    // Build visibility filter
    const visibilityFilter: string[] = ["PUBLIC"];
    if (session?.user) {
      visibilityFilter.push("BRYANT_ONLY");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      visibility: visibility
        ? { equals: visibility }
        : { in: visibilityFilter },
    };

    if (sport) {
      where.sport = { has: sport };
    }
    if (technique) {
      where.technique = { has: technique };
    }
    if (tool) {
      where.tools = { has: tool };
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    // Build ordering
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "views") {
      orderBy = { views: "desc" };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
          },
        },
      },
    });

    // Sort by average rating in JS if requested (no computed column)
    if (sort === "rating") {
      const projectsWithRating = await Promise.all(
        projects.map(async (p) => {
          const reviews = await prisma.review.findMany({
            where: { projectId: p.id },
          });
          const avg =
            reviews.length > 0
              ? reviews.reduce(
                  (sum, r) =>
                    sum +
                    (r.methodologyScore +
                      r.visualizationScore +
                      r.writingScore +
                      r.codeQualityScore +
                      r.rigorScore) /
                      5,
                  0
                ) / reviews.length
              : 0;
          return { ...p, avgRating: avg };
        })
      );
      projectsWithRating.sort((a, b) => b.avgRating - a.avgRating);
      return NextResponse.json(projectsWithRating);
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Projects GET error:", error);
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

    const body = await req.json();
    const {
      title,
      abstract,
      content,
      methodology,
      sport,
      technique,
      tools,
      domain,
      visibility,
      githubUrl,
      tableauUrl,
      videoUrl,
      openForReview,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Auto-generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Ensure uniqueness
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const project = await prisma.project.create({
      data: {
        title,
        slug,
        abstract,
        content,
        methodology,
        sport: sport || [],
        technique: technique || [],
        tools: tools || [],
        domain: domain || [],
        visibility: visibility || "PUBLIC",
        githubUrl,
        tableauUrl,
        videoUrl,
        openForReview: openForReview ?? false,
        authorId: session.user.id,
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
