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

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

const initialData: Person[] = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '555-0101', company: 'Acme Corp', notes: 'CEO' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phone: '555-0102', company: 'TechStart Inc', notes: 'CTO' },
  { id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@example.com', phone: '555-0103', company: 'Global Solutions', notes: 'Project Manager' },
  { id: '4', firstName: 'Alice', lastName: 'Brown', email: 'alice.brown@example.com', phone: '555-0104', company: 'DataFlow LLC', notes: 'Data Analyst' },
  { id: '5', firstName: 'Charlie', lastName: 'Wilson', email: 'charlie.wilson@example.com', phone: '555-0105', company: 'CloudNine', notes: 'DevOps Engineer' },
  { id: '6', firstName: 'Diana', lastName: 'Martinez', email: 'diana.martinez@example.com', phone: '555-0106', company: 'InnovateTech', notes: 'Product Manager' },
  { id: '7', firstName: 'Ethan', lastName: 'Lee', email: 'ethan.lee@example.com', phone: '555-0107', company: 'CyberSafe', notes: 'Security Specialist' },
  { id: '8', firstName: 'Fiona', lastName: 'Garcia', email: 'fiona.garcia@example.com', phone: '555-0108', company: 'AI Labs', notes: 'ML Engineer' },
  { id: '9', firstName: 'George', lastName: 'Taylor', email: 'george.taylor@example.com', phone: '555-0109', company: 'QuantumSoft', notes: 'Software Engineer' },
  { id: '10', firstName: 'Hannah', lastName: 'White', email: 'hannah.white@example.com', phone: '555-0110', company: 'NetWorks Inc', notes: 'Network Admin' },
  { id: '11', firstName: 'Ian', lastName: 'Clark', email: 'ian.clark@example.com', phone: '555-0111', company: 'WebFlow', notes: 'Frontend Developer' },
  { id: '12', firstName: 'Julia', lastName: 'Hall', email: 'julia.hall@example.com', phone: '555-0112', company: 'MobileFirst', notes: 'Mobile Developer' },
];

export default function PeopleTable() {
  const [data, setData] = useState<Person[]>(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Person | null>(null);
  const [formData, setFormData] = useState<Person>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        accessorKey: 'firstName',
        header: 'First Name',
        cell: (info) => (
          <span className="font-medium text-zinc-50">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
        cell: (info) => (
          <span className="font-medium text-zinc-50">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => (
          <a
            href={`mailto:${info.getValue() as string}`}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {info.getValue() as string}
          </a>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: (info) => (
          <span className="text-zinc-400">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: (info) => (
          <span className="text-zinc-300">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: (info) => (
          <span className="text-zinc-500 italic">{info.getValue() as string}</span>
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
    setFormData({ id: '', firstName: '', lastName: '', email: '', phone: '', company: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (entry: Person) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this person?')) {
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
          Add Person
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
              {editingEntry ? 'Edit Person' : 'Add New Person'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Company</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
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
                  {editingEntry ? 'Save Changes' : 'Add Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
