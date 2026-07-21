import DataTable from "../components/DataTable";
import OsintScanPanel from "../components/OsintScanPanel";

export default function DataPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-[90%] flex-col gap-8 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Data</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Manage company research entries and run manual OSINT scans for prospective
            employers.
          </p>
        </div>

        <OsintScanPanel />

        <section className="flex flex-col gap-4" aria-labelledby="manual-data-heading">
          <div className="flex flex-col gap-1">
            <h2 id="manual-data-heading" className="text-2xl font-semibold tracking-tight">
              Manual research entries
            </h2>
            <p className="text-sm text-muted-foreground">
              View and manage the saved company records already tracked by the app.
            </p>
          </div>
          <DataTable />
        </section>
      </div>
    </main>
  );
}
