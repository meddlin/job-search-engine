"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  isRecruiter: boolean;
  linkedinUrl: string | null;
}

type PersonFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  isRecruiter: boolean;
  linkedinUrl: string;
};

const EMPTY_FORM: PersonFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
  isRecruiter: false,
  linkedinUrl: "",
};

export default function PeopleTable() {
  const [data, setData] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<Person | null>(null);
  const [formData, setFormData] = useState<PersonFormData>(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/people");
      if (!response.ok) throw new Error("Failed to load people.");
      setData((await response.json()) as Person[]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load people.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAdd = useCallback(() => {
    setEditingEntry(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((entry: Person) => {
    setEditingEntry(entry);
    setFormData({
      firstName: entry.firstName,
      lastName: entry.lastName,
      email: entry.email ?? "",
      phone: entry.phone ?? "",
      company: entry.company ?? "",
      notes: entry.notes ?? "",
      isRecruiter: entry.isRecruiter,
      linkedinUrl: entry.linkedinUrl ?? "",
    });
    setFormError(null);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this person?")) return;

    try {
      const response = await fetch(`/api/people/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete person.");
      setData((current) => current.filter((item) => item.id !== id));
    } catch {
      window.alert("Failed to delete person.");
    }
  }, []);

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: "name",
        accessorFn: (person) => `${person.firstName} ${person.lastName}`,
        header: ({ column }) => <SortableHeader label="Name" column={column} />,
        cell: ({ row }) => (
          <div className="flex min-w-44 items-center gap-2">
            <span className="font-medium">{row.original.firstName} {row.original.lastName}</span>
            {row.original.isRecruiter ? <Badge variant="secondary">Recruiter</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => <SortableHeader label="Email" column={column} />,
        cell: ({ row }) => row.original.email ? (
          <a className="text-sm underline underline-offset-4 hover:text-primary" href={`mailto:${row.original.email}`}>
            {row.original.email}
          </a>
        ) : <EmptyValue />,
      },
      {
        accessorKey: "phone",
        header: ({ column }) => <SortableHeader label="Phone" column={column} />,
        cell: ({ row }) => row.original.phone || <EmptyValue />,
      },
      {
        accessorKey: "company",
        header: ({ column }) => <SortableHeader label="Company" column={column} />,
        cell: ({ row }) => row.original.company || <EmptyValue />,
      },
      {
        accessorKey: "linkedinUrl",
        header: "LinkedIn",
        cell: ({ row }) => row.original.linkedinUrl ? (
          <a
            className="inline-flex items-center gap-1 text-sm underline underline-offset-4 hover:text-primary"
            href={row.original.linkedinUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`LinkedIn profile for ${row.original.firstName} ${row.original.lastName}`}
          >
            Profile
            <ExternalLink data-icon="inline-end" />
          </a>
        ) : <EmptyValue />,
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => row.original.notes ? (
          <span className="block max-w-64 truncate text-muted-foreground" title={row.original.notes}>
            {row.original.notes}
          </span>
        ) : <EmptyValue />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
              <Pencil />
              <span className="sr-only">Edit {row.original.firstName} {row.original.lastName}</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => void handleDelete(row.original.id)}>
              <Trash2 />
              <span className="sr-only">Delete {row.original.firstName} {row.original.lastName}</span>
            </Button>
          </div>
        ),
      },
    ],
    [handleDelete, handleEdit],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleDialogChange = (open: boolean) => {
    if (!isSaving) setIsDialogOpen(open);
    if (!open) setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    try {
      const response = await fetch(editingEntry ? `/api/people/${editingEntry.id}` : "/api/people", {
        method: editingEntry ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const savedPerson = (await response.json()) as Person;
      setData((current) => editingEntry
        ? current.map((person) => person.id === editingEntry.id ? savedPerson : person)
        : [savedPerson, ...current]);
      setIsDialogOpen(false);
    } catch (caughtError) {
      setFormError(caughtError instanceof Error ? caughtError.message : "Failed to save person.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading people...</div>;
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button type="button" variant="outline" onClick={() => void fetchData()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search people"
          type="search"
          placeholder="Search people"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Button type="button" onClick={handleAdd}>
          <Plus data-icon="inline-start" />
          Add Person
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.id === "actions" ? "text-right" : undefined}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {globalFilter ? "No people match your search." : "No people have been added yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Rows per page
          <select
            value={table.getState().pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="h-8 rounded-md border bg-background px-2 text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </span>
          <Button type="button" variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Person" : "Add Person"}</DialogTitle>
            <DialogDescription>
              Save the contact details you have. Only a first and last name are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FieldGroup className="gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="person-first-name">First name</FieldLabel>
                  <Input
                    id="person-first-name"
                    required
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(event) => setFormData((current) => ({ ...current, firstName: event.target.value }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="person-last-name">Last name</FieldLabel>
                  <Input
                    id="person-last-name"
                    required
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(event) => setFormData((current) => ({ ...current, lastName: event.target.value }))}
                  />
                </Field>
              </div>

              <Field orientation="horizontal" className="rounded-md border p-4">
                <FieldContent>
                  <FieldLabel htmlFor="person-recruiter">Recruiter</FieldLabel>
                  <FieldDescription>Include this person in recruiter tracking.</FieldDescription>
                </FieldContent>
                <Switch
                  id="person-recruiter"
                  checked={formData.isRecruiter}
                  onCheckedChange={(isRecruiter) => setFormData((current) => ({ ...current, isRecruiter }))}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="person-linkedin">LinkedIn profile</FieldLabel>
                <Input
                  id="person-linkedin"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="linkedin.com/in/profile"
                  value={formData.linkedinUrl}
                  onChange={(event) => setFormData((current) => ({ ...current, linkedinUrl: event.target.value }))}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="person-email">Email</FieldLabel>
                  <Input
                    id="person-email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="person-phone">Phone</FieldLabel>
                  <Input
                    id="person-phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="person-company">Company</FieldLabel>
                <Input
                  id="person-company"
                  autoComplete="organization"
                  value={formData.company}
                  onChange={(event) => setFormData((current) => ({ ...current, company: event.target.value }))}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="person-notes">Notes</FieldLabel>
                <Textarea
                  id="person-notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                />
              </Field>

              {formError ? <FieldError>{formError}</FieldError> : null}
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingEntry ? "Save changes" : "Add Person"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyValue() {
  return <span className="text-muted-foreground" aria-label="Not provided">&mdash;</span>;
}

function SortableHeader({ label, column }: { label: string; column: { toggleSorting: (descending?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ChevronsUpDown data-icon="inline-end" />
    </Button>
  );
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "Failed to save person.";
  } catch {
    return "Failed to save person.";
  }
}
