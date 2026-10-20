import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AssessmentResultClient } from "./assessment-result-client";
import { parseJsonSafe } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return { title: `Assessment ${resolvedParams.id.slice(0, 8)}` };
}

export default async function AssessmentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const assessment = await prisma.exportAssessment.findUnique({
    where: { id: resolvedParams.id },
    include: {
      destination: {
        include: { authorities: true, certificates: { include: { certificate: true } } },
      },
      origin: true,
      items: { include: { assessment: false } },
      results: {
        include: {
          product: { include: { category: true } },
          warnings: true,
        },
      },
      warnings: true,
      user: { select: { name: true, email: true } },
      company: true,
    },
  });

  if (!assessment) notFound();

  // Check access
  const userId = session.user.id!;
  const role = (session.user as any).role;
  if (assessment.userId !== userId && role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") {
    redirect("/dashboard");
  }

  // Parse JSON fields
  const resultsWithParsed = assessment.results.map((r) => ({
    ...r,
    requiredDocs: parseJsonSafe<string[]>(r.requiredDocs, []),
    certificates: parseJsonSafe<string[]>(r.certificates, []),
    labelRequirements: parseJsonSafe<string[]>(r.labelRequirements, []),
    packagingNotes: parseJsonSafe<string[]>(r.packagingNotes, []),
    customsNotes: parseJsonSafe<string[]>(r.customsNotes, []),
    recommendations: parseJsonSafe<string[]>(r.recommendations, []),
    regulationRefs: parseJsonSafe<string[]>(r.regulationRefs, []),
    resolutionChecklist: parseJsonSafe<any[]>(r.resolutionChecklist, []),
    generatedDocuments: parseJsonSafe<any[]>(r.generatedDocuments, []),
    decisionExplanation: parseJsonSafe<any>(r.decisionExplanation, {}),
  }));

  return (
    <AssessmentResultClient
      assessment={{ ...assessment, results: resultsWithParsed }}
    />
  );
}
