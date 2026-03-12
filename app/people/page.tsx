import PeopleTable from '../components/PeopleTable';

export default function PeoplePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-50">People Management</h1>
          <p className="text-zinc-400 mt-2">View and manage your contacts</p>
        </div>
        <PeopleTable />
      </div>
    </div>
  );
}
