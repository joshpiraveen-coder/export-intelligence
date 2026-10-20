import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Dashboard",
};

async function getDashboardData(userId: string, companyId?: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    totalAssessments,
    recentAssessments,
    riskDistribution,
    topCountries,
    regulationUpdates,
  ] = await Promise.all([
    // Total products
    prisma.product.count({
      where: companyId ? { companyId } : {},
    }),

    // Total assessments
    prisma.exportAssessment.count({
      where: { userId },
    }),

    // Recent assessments
    prisma.exportAssessment.findMany({
      where: { userId },
      include: {
        destination: { select: { name: true, isoCode: true, flag: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),

    // Risk distribution
    prisma.exportAssessment.groupBy({
      by: ["riskLevel"],
      where: { userId, status: "COMPLETED" },
      _count: true,
    }),

    // Top destination countries
    prisma.exportAssessment.groupBy({
      by: ["destinationId"],
      where: { userId },
      _count: { destinationId: true },
      orderBy: { _count: { destinationId: "desc" } },
      take: 6,
    }),

    // Recent regulation updates
    prisma.regulationUpdate.findMany({
      include: {
        regulation: {
          include: { country: { select: { name: true, isoCode: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Compliance success rate
  const completedAssessments = await prisma.exportAssessment.findMany({
    where: { userId, status: "COMPLETED" },
    select: { overallScore: true },
  });

  const successRate =
    completedAssessments.length > 0
      ? Math.round(
          (completedAssessments.filter((a) => (a.overallScore || 0) >= 70)
            .length /
            completedAssessments.length) *
            100
        )
      : 0;

  // High risk count
  const highRiskCount = riskDistribution.find((r) => r.riskLevel === "RED")?._count || 0;

  // Countries analyzed
  const countriesAnalyzed = await prisma.exportAssessment.findMany({
    where: { userId },
    select: { destinationId: true },
    distinct: ["destinationId"],
  });

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const count = await prisma.exportAssessment.count({
      where: { userId, createdAt: { gte: start, lte: end } },
    });
    monthlyTrend.push({
      month: start.toLocaleString("default", { month: "short" }),
      assessments: count,
    });
  }

  // Resolve top country names
  const topCountryDetails = await Promise.all(
    topCountries.map(async (tc) => {
      const country = await prisma.country.findUnique({
        where: { id: tc.destinationId },
        select: { name: true, isoCode: true },
      });
      return { name: country?.name || "Unknown", isoCode: country?.isoCode || "", count: tc._count.destinationId };
    })
  );

  // Assessments not yet finalized (DRAFT or ANALYZING) — a real "pending" metric
  const pendingCount = await prisma.exportAssessment.count({
    where: { userId, status: { in: ["DRAFT", "ANALYZING"] } },
  });

  return {
    stats: {
      totalProducts,
      totalAssessments,
      countriesAnalyzed: countriesAnalyzed.length,
      successRate,
      highRiskCount,
      pendingCount,
    },
    recentAssessments,
    riskDistribution: riskDistribution.map((r) => ({
      name: r.riskLevel || "Unknown",
      value: r._count,
    })),
    monthlyTrend,
    topCountries: topCountryDetails,
    regulationUpdates,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id!;
  const companyId = (session.user as any).companyId;
  const data = await getDashboardData(userId, companyId);

  return <DashboardClient data={data} userName={session.user.name || "User"} />;
}
