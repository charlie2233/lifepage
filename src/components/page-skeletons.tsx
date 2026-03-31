function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return <div className={`lp-skeleton rounded-2xl ${className}`} />;
}

export function MarketingPageSkeleton() {
  return (
    <div className="lp-page text-white">
      <div className="lp-shell py-6">
        <div className="flex items-center justify-between gap-4">
          <SkeletonBlock className="h-12 w-44" />
          <SkeletonBlock className="h-11 w-72" />
        </div>
      </div>
      <div className="lp-shell grid gap-8 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-5">
          <SkeletonBlock className="h-8 w-40" />
          <SkeletonBlock className="h-20 w-full max-w-3xl" />
          <SkeletonBlock className="h-24 w-full max-w-2xl" />
          <div className="flex flex-wrap gap-3">
            <SkeletonBlock className="h-12 w-44" />
            <SkeletonBlock className="h-12 w-40" />
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <SkeletonBlock className="h-[28rem] w-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#080d10] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <SkeletonBlock className="h-14 w-full" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
          <SkeletonBlock className="h-52 w-full" />
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <SkeletonBlock className="h-28 w-full" />
            <SkeletonBlock className="h-28 w-full" />
            <SkeletonBlock className="h-28 w-full" />
          </div>
        </div>
        <SkeletonBlock className="h-14 w-[32rem]" />
        <SkeletonBlock className="h-72 w-full" />
      </div>
    </div>
  );
}

export function PublicPageSkeleton() {
  return (
    <div className="lp-page text-white">
      <div className="lp-shell py-6">
        <SkeletonBlock className="h-12 w-full" />
      </div>
      <div className="lp-shell grid gap-8 py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <SkeletonBlock className="h-[24rem] w-full" />
        <div className="grid gap-4">
          <SkeletonBlock className="h-44 w-full" />
          <SkeletonBlock className="h-44 w-full" />
        </div>
      </div>
      <div className="lp-shell grid gap-5 pb-16 lg:grid-cols-2">
        <SkeletonBlock className="h-80 w-full" />
        <SkeletonBlock className="h-80 w-full" />
      </div>
    </div>
  );
}

export function ResumePageSkeleton() {
  return (
    <div className="lp-page text-white">
      <div className="lp-shell py-6">
        <SkeletonBlock className="h-12 w-full" />
      </div>
      <div className="lp-shell grid gap-6 py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <SkeletonBlock className="h-56 w-full" />
        <div className="grid gap-4">
          <SkeletonBlock className="h-36 w-full" />
          <SkeletonBlock className="h-36 w-full" />
        </div>
      </div>
      <div className="lp-shell pb-16">
        <SkeletonBlock className="h-[44rem] w-full" />
      </div>
    </div>
  );
}
