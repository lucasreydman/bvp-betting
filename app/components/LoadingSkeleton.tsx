export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Top plays skeleton */}
      <div className="bg-gray-900 rounded-lg p-4 h-40" />
      {/* Filters skeleton */}
      <div className="bg-gray-900 rounded-lg p-4 h-20" />
      {/* Table skeleton */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="h-10 bg-gray-800 mb-1" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-900 border-t border-gray-800" />
        ))}
      </div>
    </div>
  )
}
