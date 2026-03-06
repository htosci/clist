import { SchoolCardSkeleton } from "@/components/schools/school-card-skeleton"

export default function Loading() {
  return (
    <main className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <div className="h-9 w-64 bg-muted animate-pulse rounded-md mb-2" />
        <div className="h-5 w-48 bg-muted animate-pulse rounded-md" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SchoolCardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
