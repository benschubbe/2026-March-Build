import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Run all queries in parallel
    const [
      user,
      posts,
      projects,
      totalComments,
      totalReactions,
      reactionBreakdown,
      reviewsReceived,
      reviewsGiven,
      certifications,
      challengeSubmissions,
    ] = await Promise.all([
      // User profile
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true, createdAt: true },
      }),

      // All user posts with reactions and comments
      prisma.post.findMany({
        where: { authorId: userId },
        include: {
          reactions: true,
          comments: true,
          channel: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // All user projects with views and comments
      prisma.project.findMany({
        where: { authorId: userId },
        include: {
          comments: true,
          reviews: true,
        },
        orderBy: { createdAt: "desc" },
      }),

      // Total comments received on user's posts
      prisma.comment.count({
        where: { post: { authorId: userId } },
      }),

      // Total reactions received on user's posts
      prisma.reaction.count({
        where: { post: { authorId: userId } },
      }),

      // Reaction breakdown
      prisma.reaction.groupBy({
        by: ["type"],
        where: { post: { authorId: userId } },
        _count: true,
      }),

      // Reviews received
      prisma.review.findMany({
        where: { authorId: userId },
        select: {
          methodologyScore: true,
          visualizationScore: true,
          writingScore: true,
          codeQualityScore: true,
          rigorScore: true,
        },
      }),

      // Reviews given
      prisma.review.count({
        where: { reviewerId: userId },
      }),

      // Certifications
      prisma.certification.count({
        where: { userId },
      }),

      // Challenge submissions
      prisma.challengeSubmission.findMany({
        where: { userId },
        select: { votes: true, winner: true },
      }),
    ]);

    // Aggregate reaction breakdown
    const reactions: Record<string, number> = {
      UPVOTE: 0,
      INSIGHTFUL: 0,
      FIRE: 0,
      CLAP: 0,
    };
    for (const r of reactionBreakdown) {
      reactions[r.type] = r._count;
    }

    // Total project views
    const totalProjectViews = projects.reduce((sum, p) => sum + p.views, 0);

    // Total project comments
    const totalProjectComments = projects.reduce(
      (sum, p) => sum + p.comments.length,
      0
    );

    // Average review scores
    const avgScores =
      reviewsReceived.length > 0
        ? {
            methodology:
              reviewsReceived.reduce((s, r) => s + r.methodologyScore, 0) /
              reviewsReceived.length,
            visualization:
              reviewsReceived.reduce((s, r) => s + r.visualizationScore, 0) /
              reviewsReceived.length,
            writing:
              reviewsReceived.reduce((s, r) => s + r.writingScore, 0) /
              reviewsReceived.length,
            codeQuality:
              reviewsReceived.reduce((s, r) => s + r.codeQualityScore, 0) /
              reviewsReceived.length,
            rigor:
              reviewsReceived.reduce((s, r) => s + r.rigorScore, 0) /
              reviewsReceived.length,
          }
        : null;

    // Challenge stats
    const challengeWins = challengeSubmissions.filter((s) => s.winner).length;
    const challengeVotes = challengeSubmissions.reduce(
      (sum, s) => sum + s.votes,
      0
    );

    // Top posts by engagement (reactions + comments)
    const topPosts = posts
      .map((p) => ({
        id: p.id,
        content:
          p.content.length > 100 ? p.content.slice(0, 100) + "..." : p.content,
        reactions: p.reactions.length,
        comments: p.comments.length,
        engagement: p.reactions.length + p.comments.length,
        channel: p.channel?.name ?? null,
        createdAt: p.createdAt,
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // Posts per month (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const postsPerMonth: { month: string; posts: number; reactions: number }[] =
      [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const monthPosts = posts.filter(
        (p) => p.createdAt >= monthStart && p.createdAt <= monthEnd
      );
      postsPerMonth.push({
        month: monthLabel,
        posts: monthPosts.length,
        reactions: monthPosts.reduce((s, p) => s + p.reactions.length, 0),
      });
    }

    // Estimated impressions (posts × average reach multiplier)
    // Simple model: each post gets ~15x reactions as impressions minimum
    const estimatedImpressions = posts.reduce(
      (sum, p) => sum + Math.max(p.reactions.length * 15, 25),
      0
    );

    return NextResponse.json({
      user,
      overview: {
        totalPosts: posts.length,
        totalReactions,
        totalComments,
        totalProjectViews,
        totalProjectComments,
        totalProjects: projects.length,
        estimatedImpressions,
        reviewsGiven,
        reviewsReceived: reviewsReceived.length,
        certifications,
        challengeSubmissions: challengeSubmissions.length,
        challengeWins,
        challengeVotes,
      },
      reactions,
      avgScores,
      topPosts,
      postsPerMonth,
      topProjects: projects
        .map((p) => ({
          slug: p.slug,
          title: p.title,
          views: p.views,
          comments: p.comments.length,
          reviewCount: p.reviews.length,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
