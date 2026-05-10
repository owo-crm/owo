export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl animate-pulse space-y-4">
        <div className="h-12 w-64 rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
          <div className="h-[620px] rounded-2xl bg-slate-200" />
          <div className="h-[620px] rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

