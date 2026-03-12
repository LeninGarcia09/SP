import { useProjects } from '../hooks/use-projects';
import { usePersonnel } from '../hooks/use-personnel';
import { useInventoryItems } from '../hooks/use-inventory';

export function DashboardPage() {
  const projects = useProjects({ limit: 100 });
  const personnel = usePersonnel({ limit: 100 });
  const inventory = useInventoryItems({ limit: 100 });

  const activeProjects = projects.data?.data?.filter((p) => p.status === 'ACTIVE').length ?? '—';
  const totalPersonnel = personnel.data?.data?.length ?? '—';
  const totalInventory = inventory.data?.data?.length ?? '—';

  const isLoading = projects.isLoading || personnel.isLoading || inventory.isLoading;
  const hasError = projects.isError || personnel.isError || inventory.isError;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {hasError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 mb-6 text-sm text-destructive">
          Failed to load dashboard data. Is the API running?
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Active Projects</p>
          <p className="text-3xl font-bold mt-2">
            {isLoading ? '…' : activeProjects}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Projects</p>
          <p className="text-3xl font-bold mt-2">
            {isLoading ? '…' : (projects.data?.meta?.total ?? projects.data?.data?.length ?? '—')}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Personnel</p>
          <p className="text-3xl font-bold mt-2">
            {isLoading ? '…' : totalPersonnel}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Inventory Items</p>
          <p className="text-3xl font-bold mt-2">
            {isLoading ? '…' : totalInventory}
          </p>
        </div>
      </div>

      {/* Recent Projects */}
      {projects.data?.data && projects.data.data.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Code</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Budget</th>
                </tr>
              </thead>
              <tbody>
                {projects.data.data.slice(0, 5).map((project) => (
                  <tr key={project.id} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">{project.code}</td>
                    <td className="p-3">{project.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-3">${Number(project.budget).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
