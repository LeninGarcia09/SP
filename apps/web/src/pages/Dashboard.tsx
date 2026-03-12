export function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Active Projects</p>
          <p className="text-3xl font-bold mt-2">—</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Open Tasks</p>
          <p className="text-3xl font-bold mt-2">—</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Personnel</p>
          <p className="text-3xl font-bold mt-2">—</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Inventory Items</p>
          <p className="text-3xl font-bold mt-2">—</p>
        </div>
      </div>
    </div>
  );
}
