import KanbanBoard from '../components/KanbanBoard';

export default function KanbanPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-50 px-[min(5vw,1.5rem)] py-6">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-50">Job Search Kanban</h1>
          <p className="text-zinc-400 mt-2">Track your job applications and interview progress</p>
        </div>
        <KanbanBoard />
      </div>
    </div>
  );
}
