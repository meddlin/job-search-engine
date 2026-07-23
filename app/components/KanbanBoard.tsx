'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface JobApplication {
  id: number;
  companyName: string | null;
  positionTitle: string | null;
  status: string | null;
  remote: string | null;
  applied: boolean | null;
  notes: string | null;
  jobUrl: string | null;
  jobDescription: string | null;
  recruiterName: string | null;
  recruitingAgency: string | null;
  recruiterEmail: string | null;
  recruiterPhone: string | null;
  recruiterLinkedin: string | null;
  dateAdded: Date | string;
  updatedAt: Date | string;
}

type StatusType = string;
type RemoteType = string;

const COLUMNS: { id: StatusType; label: string }[] = [
  { id: 'initiation', label: 'Initiation' },
  { id: 'phone_screen', label: 'Phone Screen' },
  { id: 'apply', label: 'Apply' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'offer_accept', label: 'Offer/Accept' },
  { id: 'rejected', label: 'Rejected' },
];

export default function KanbanBoard() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    positionTitle: '',
    status: 'initiation' as StatusType,
    remote: '' as RemoteType,
    applied: false,
    jobUrl: '',
    jobDescription: '',
    recruiterName: '',
    recruitingAgency: '',
    recruiterEmail: '',
    recruiterPhone: '',
    recruiterLinkedin: '',
    notes: '',
  });

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchJobs);
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const jobId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId as StatusType;

    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job))
    );

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      fetchJobs();
    }
  };

  const handleAdd = () => {
    setEditingJob(null);
    setFormData({
      companyName: '',
      positionTitle: '',
      status: 'initiation',
      remote: '',
      applied: false,
      jobUrl: '',
      jobDescription: '',
      recruiterName: '',
      recruitingAgency: '',
      recruiterEmail: '',
      recruiterPhone: '',
      recruiterLinkedin: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (job: JobApplication) => {
    setEditingJob(job);
    setFormData({
      companyName: job.companyName || '',
      positionTitle: job.positionTitle || '',
      status: job.status || 'initiation',
      remote: job.remote || '',
      applied: job.applied || false,
      jobUrl: job.jobUrl || '',
      jobDescription: job.jobDescription || '',
      recruiterName: job.recruiterName || '',
      recruitingAgency: job.recruitingAgency || '',
      recruiterEmail: job.recruiterEmail || '',
      recruiterPhone: job.recruiterPhone || '',
      recruiterLinkedin: job.recruiterLinkedin || '',
      notes: job.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this job application?')) {
      try {
        const response = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete');
        setJobs(jobs.filter((job) => job.id !== id));
      } catch (error) {
        alert('Failed to delete job application');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        const response = await fetch(`/api/jobs/${editingJob.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to update');
        const updated = await response.json();
        setJobs(jobs.map((job) => (job.id === editingJob.id ? updated : job)));
      } else {
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to create');
        const newJob = await response.json();
        setJobs([...jobs, newJob]);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert('Failed to save job application');
    }
  };

  const getJobsByStatus = (status: StatusType) => jobs.filter((job) => job.status === status);

  const getRemoteBadgeClass = (remote: string | null) => {
    switch (remote) {
      case 'yes':
        return 'bg-green-900/50 text-green-300';
      case 'no':
        return 'bg-red-900/50 text-red-300';
      case 'hybrid':
        return 'bg-yellow-900/50 text-yellow-300';
      default:
        return 'bg-zinc-700 text-zinc-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-zinc-50">Job Applications</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Add Job
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <div key={column.id} className="min-w-72 flex-1">
              <div className="bg-zinc-900 rounded-lg p-3">
                <h3 className="font-semibold text-zinc-50 mb-3 flex items-center justify-between">
                  {column.label}
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">
                    {getJobsByStatus(column.id).length}
                  </span>
                </h3>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] space-y-3 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-zinc-800/50 rounded-lg p-2' : ''
                      }`}
                    >
                      {getJobsByStatus(column.id).map((job, index) => (
                        <Draggable key={job.id} draggableId={job.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-zinc-800 rounded-lg p-4 cursor-grab active:cursor-grabbing transition-colors ${
                                snapshot.isDragging ? 'ring-2 ring-zinc-500 shadow-lg' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-1 flex-wrap">
                                  <span className={`text-xs px-2 py-1 rounded-full ${getRemoteBadgeClass(job.remote)}`}>
                                    {job.remote === 'yes' ? 'Remote' : job.remote === 'no' ? 'On-site' : job.remote === 'hybrid' ? 'Hybrid' : 'Unknown'}
                                  </span>
                                  {job.applied && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-300">
                                      Applied
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEdit(job)}
                                    className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                                    title="Edit"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                      <path d="m15 5 4 4" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(job.id)}
                                    className="p-1 rounded hover:bg-red-900/50 text-zinc-400 hover:text-red-300 transition-colors"
                                    title="Delete"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18" />
                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <h4 className="font-medium text-zinc-50 mb-1">{job.positionTitle || 'Untitled Position'}</h4>
                              <p className="text-sm text-zinc-400 mb-1">{job.companyName || 'Unknown Company'}</p>
                              {job.recruiterName && (
                                <p className="text-xs text-zinc-500">Recruiter: {job.recruiterName}</p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-zinc-50 mb-4">
              {editingJob ? 'Edit Job Application' : 'Add New Job Application'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Position Title</label>
                  <input
                    type="text"
                    value={formData.positionTitle}
                    onChange={(e) => setFormData({ ...formData, positionTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusType })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>{col.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Remote</label>
                  <select
                    value={formData.remote}
                    onChange={(e) => setFormData({ ...formData, remote: e.target.value as RemoteType })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes - Remote</option>
                    <option value="no">No - On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.applied}
                      onChange={(e) => setFormData({ ...formData, applied: e.target.checked })}
                      className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-zinc-100 focus:ring-zinc-600"
                    />
                    <span className="text-sm text-zinc-300">Applied</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Job URL</label>
                <input
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Job Description</label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  rows={4}
                  placeholder="Paste job description here..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
                />
              </div>

              <div className="border-t border-zinc-700 pt-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Recruiter Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Recruiter Name</label>
                    <input
                      type="text"
                      value={formData.recruiterName}
                      onChange={(e) => setFormData({ ...formData, recruiterName: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Recruiting Agency</label>
                    <input
                      type="text"
                      value={formData.recruitingAgency}
                      onChange={(e) => setFormData({ ...formData, recruitingAgency: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Recruiter Email</label>
                    <input
                      type="email"
                      value={formData.recruiterEmail}
                      onChange={(e) => setFormData({ ...formData, recruiterEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Recruiter Phone</label>
                    <input
                      type="tel"
                      value={formData.recruiterPhone}
                      onChange={(e) => setFormData({ ...formData, recruiterPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Recruiter LinkedIn</label>
                    <input
                      type="url"
                      value={formData.recruiterLinkedin}
                      onChange={(e) => setFormData({ ...formData, recruiterLinkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
                  {editingJob ? 'Save Changes' : 'Add Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
