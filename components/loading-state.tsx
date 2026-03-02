import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      {/* Activity cards skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-28 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conditions skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="mb-3 h-4 w-16" />
              <Skeleton className="mb-4 h-8 w-24" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
