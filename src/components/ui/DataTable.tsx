import React from 'react';

interface TableData {
  headers: string[];
  rows: string[][];
}

interface DataTableProps {
  data: TableData;
  title?: string;
}

const DataTable: React.FC<DataTableProps> = ({ data, title }) => {
  if (!data || !data.headers || !data.rows) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-slate-900 border border-slate-600 rounded-lg overflow-x-auto">
      {title && (
        <h3 className="text-base font-semibold mb-4 text-white">{title}</h3>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-600 rounded-lg">
          <thead>
            <tr className="bg-slate-800">
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  className="border border-slate-600 px-3 py-2 text-left font-medium text-white text-sm"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? "bg-slate-900" : "bg-slate-800/50"}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border border-slate-600 px-3 py-2 text-sm text-gray-100"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-400">
        {data.rows.length} row{data.rows.length !== 1 ? 's' : ''} × {data.headers.length} column{data.headers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default DataTable;
