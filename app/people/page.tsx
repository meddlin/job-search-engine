import PeopleTable from "../components/PeopleTable";

export default function PeoplePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-[90%] flex-col gap-6 py-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">People</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Keep contact details, recruiter status, and profile links together.
          </p>
        </header>
        <PeopleTable />
      </div>
    </main>
  );
}
