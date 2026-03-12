import { useState } from 'react';
import { useProjects } from '../hooks/use-projects';

export function ProjectsPage() {
  const [page, setPage] = useState(1);
  const projects = useProjects({ page, limit: 25 });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          New Project
        </button>
      </div>

      {projects.isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          Loading projects…
        </div>
      )}

      {projects.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load projects. Is the API running?
        </div>
      )}

      {projects.data?.data && projects.data.data.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            No projects yet. Create your first project to get started.
          </div>
        </div>
      )}

      {projects.data?.data && projects.data.data.length > 0 && (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Code</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Start Date</th>
                  <th className="text-left p-3 font-medium">End Date</th>
                  <th className="text-left p-3 font-medium">Budget</th>
                </tr>
              </thead>
              <tbody>
                {projects.data.data.map((project) => (
                  <tr key={project.id} className="border-b last:border-0 hover:bg-muted/25 cursor-pointer">
                    <td className="p-3 font-mono text-xs">{project.code}</td>
                    <td className="p-3 font-medium">{project.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-3">{project.startDate ?? '—'}</td>
                    <td className="p-3">{project.endDate ?? '—'}</td>
                    <td className="p-3">${Number(project.budget).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {projects.data.meta && projects.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                Page {projects.data.meta.page} of {projects.data.meta.totalPages} · {projects.data.meta.total} total
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page >= (projects.data.meta.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
