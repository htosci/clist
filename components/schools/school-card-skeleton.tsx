// components/schools/school-card-skeleton.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SchoolCardSkeleton() {
  return (
    <Card className="flex flex-col h-full border-muted/40">
      <CardHeader className="p-4 pb-2">
        {/* Badges placeholder */}
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        {/* Title placeholder (2 lines) */}
        <div className="space-y-2 mb-1">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex flex-col gap-4 flex-grow">
        {/* Location placeholder */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full shrink-0" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Features placeholders */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-md shrink-0" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-md shrink-0" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>

        {/* Footer placeholder */}
        <div className="mt-auto pt-4 border-t flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  )
}