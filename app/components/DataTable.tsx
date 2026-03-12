'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';

interface DataEntry {
  id: string;
  name: string;
  companyInfo: string;
  url: string;
  industry: string;
}

const initialData: DataEntry[] = [
  { id: '1', name: 'John Doe', companyInfo: 'Acme Corp', url: 'https://acme.com', industry: 'Technology' },
  { id: '2', name: 'Jane Smith', companyInfo: 'TechStart Inc', url: 'https://techstart.io', industry: 'Software' },
  { id: '3', name: 'Bob Johnson', companyInfo: 'Global Solutions', url: 'https://globalsolutions.com', industry: 'Consulting' },
  { id: '4', name: 'Alice Brown', companyInfo: 'DataFlow LLC', url: 'https://dataflow.dev', industry: 'Data Analytics' },
  { id: '5', name: 'Charlie Wilson', companyInfo: 'CloudNine', url: 'https://cloudnine.cloud', industry: 'Cloud Services' },
  { id: '6', name: 'Diana Martinez', companyInfo: 'InnovateTech', url: 'https://innovatetech.co', industry: 'Technology' },
  { id: '7', name: 'Ethan Lee', companyInfo: 'CyberSafe', url: 'https://cybersafe.io', industry: 'Cybersecurity' },
  { id: '8', name: 'Fiona Garcia', companyInfo: 'AI Labs', url: 'https://ailabs.ai', industry: 'Artificial Intelligence' },
  { id: '9', name: 'George Taylor', companyInfo: 'QuantumSoft', url: 'https://quantumsoft.com', industry: 'Software' },
  { id: '10', name: 'Hannah White', companyInfo: 'NetWorks Inc', url: 'https://networks.inc', industry: 'Networking' },
  { id: '11', name: 'Ian Clark', companyInfo: 'WebFlow', url: 'https://webflow.io', industry: 'Web Development' },
  { id: '12', name: 'Julia Hall', companyInfo: 'MobileFirst', url: 'https://mobilefirst.app', industry: 'Mobile Apps' },
];

export default function DataTable() {
  const [data, setData] = useState<DataEntry[]>(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DataEntry | null>(null);
  const [formData, setFormData] = useState<DataEntry>({
    id: '',
    name: '',
    companyInfo: '',
    url: '',
    industry: '',
  });

  const columns = useMemo<ColumnDef<DataEntry>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info) => (
          <span className="font-medium text-zinc-50">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'companyInfo',
        header: 'Company Info',
        cell: (info) => (
          <span className="text-zinc-400">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'url',
        header: 'URL',
        cell: (info) => (
          <a
            href={info.getValue() as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {info.getValue() as string}
          </a>
        ),
      },
      {
        accessorKey: 'industry',
        header: 'Industry',
        cell: (info) => (
          <span className="px-2 py-1 text-xs rounded-full bg-zinc-800 text-zinc-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(info.row.original)}
              className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-1.5 rounded bg-red-900/50 hover:bg-red-800 text-red-300 transition-colors"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleAdd = () => {
    setEditingEntry(null);
    setFormData({ id: '', name: '', companyInfo: '', url: '', industry: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (entry: DataEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setData(data.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      setData(data.map((item) => (item.id === editingEntry.id ? formData : item)));
    } else {
      setData([...data, { ...formData, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 w-full sm:w-64"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Add Entry
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full bg-black">
          <thead className="bg-zinc-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left text-sm font-semibold text-zinc-400 cursor-pointer hover:text-zinc-200 hover:bg-zinc-800 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m18 15-6-6-6 6" />
                          </svg>
                        ),
                        desc: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        ),
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-900/50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span>Rows per page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-50 focus:outline-none"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-zinc-50 mb-4">
              {editingEntry ? 'Edit Entry' : 'Add New Entry'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Company Info</label>
                <input
                  type="text"
                  required
                  value={formData.companyInfo}
                  onChange={(e) => setFormData({ ...formData, companyInfo: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">URL</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Industry</label>
                <input
                  type="text"
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-zinc-100 text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  {editingEntry ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
