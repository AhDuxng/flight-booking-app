export default function AdminDataTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-container-high bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-surface-container-low">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 text-label-md font-label-md uppercase text-on-surface-variant" key={column.key}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {rows.map((row) => (
              <tr className="transition-colors hover:bg-surface-container-low" key={row.id}>
                {columns.map((column) => (
                  <td className="px-4 py-3 text-body-sm font-body-sm text-on-surface" key={column.key}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
