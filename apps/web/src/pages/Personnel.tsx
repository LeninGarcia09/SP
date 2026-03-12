import { useState } from 'react';
import { usePersonnel } from '../hooks/use-personnel';

export function PersonnelPage() {
  const [page, setPage] = useState(1);
  const personnel = usePersonnel({ page, limit: 25 });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Personnel</h2>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Add Person
        </button>
      </div>

      {personnel.isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          Loading personnel…
        </div>
      )}

      {personnel.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load personnel. Is the API running?
        </div>
      )}

      {personnel.data?.data && personnel.data.data.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            No personnel records yet. Add your first team member.
          </div>
        </div>
      )}

      {personnel.data?.data && personnel.data.data.length > 0 && (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Job Title</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Start Date</th>
                </tr>
              </thead>
              <tbody>
                {personnel.data.data.map((person) => (
                  <tr key={person.id} className="border-b last:border-0 hover:bg-muted/25 cursor-pointer">
                    <td className="p-3 font-medium">{person.firstName} {person.lastName}</td>
                    <td className="p-3">{person.email}</td>
                    <td className="p-3">{person.jobTitle}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        person.assignmentStatus === 'ON_PROJECT' ? 'bg-green-100 text-green-700' :
                        person.assignmentStatus === 'ON_BENCH' ? 'bg-yellow-100 text-yellow-700' :
                        person.assignmentStatus === 'ON_OPERATIONS' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {person.assignmentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3">{person.startDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {personnel.data.meta && personnel.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                Page {personnel.data.meta.page} of {personnel.data.meta.totalPages} · {personnel.data.meta.total} total
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
                  disabled={page >= (personnel.data.meta.totalPages ?? 1)}
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
