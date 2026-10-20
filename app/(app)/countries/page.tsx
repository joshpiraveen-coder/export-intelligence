import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { countryFlag } from "@/lib/utils";
import { Globe, Search } from "lucide-react";

export const metadata = { title: "Countries" };

export default async function CountriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const where: any = { isActive: true };
  if (resolvedSearchParams.q) {
    where.OR = [
      { name: { contains: resolvedSearchParams.q } },
      { isoCode: { contains: resolvedSearchParams.q } },
    ];
  }
  if (resolvedSearchParams.region) where.region = resolvedSearchParams.region;

  const [countries, regions] = await Promise.all([
    prisma.country.findMany({
      where,
      include: {
        _count: { select: { regulations: true, restrictions: true, assessmentsTo: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.country.findMany({
      where: { isActive: true, region: { not: null } },
      select: { region: true },
      distinct: ["region"],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Countries</h1>
          <p className="text-sm text-muted-foreground">
            {countries.length} countries in the regulation database
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <form className="flex-1 flex gap-2" method="get">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={resolvedSearchParams.q || ""}
              placeholder="Search countries…"
              className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <select
            name="region"
            defaultValue={resolvedSearchParams.region || ""}
            className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none"
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.region} value={r.region || ""}>{r.region}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Countries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {countries.map((country) => (
          <Link key={country.id} href={`/countries/${country.id}`}>
            <div className="glass-card p-4 hover:border-primary/40 hover:shadow-glow transition-all duration-300 cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">
                  {country.flag || countryFlag(country.isoCode)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {country.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{country.isoCode} • {country.region || "—"}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{country._count.regulations} regulations</span>
                <span>•</span>
                <span>{country._count.assessmentsTo} assessments</span>
              </div>
              {country._count.restrictions > 0 && (
                <div className="mt-2 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full inline-block">
                  {country._count.restrictions} restrictions
                </div>
              )}
            </div>
          </Link>
        ))}

        {countries.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Globe size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No countries found</p>
          </div>
        )}
      </div>
    </div>
  );
}
