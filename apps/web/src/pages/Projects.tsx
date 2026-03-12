export function ProjectsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          New Project
        </button>
      </div>
      <div className="rounded-lg border">
        <div className="p-6 text-center text-muted-foreground">
          No projects yet. Create your first project to get started.
        </div>
      </div>
    </div>
  );
}
