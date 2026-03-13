import { NextResponse } from 'next/server';
import { updateJobApplication, deleteJobApplication, updateJobApplicationStatus } from '@/lib/job-applications';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();

    if (body.status && !['initiation', 'phone_screen', 'apply', 'interviewing', 'offer_accept'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (body.source_type && !['direct', 'recruiter'].includes(body.source_type)) {
      return NextResponse.json({ error: 'Invalid source_type' }, { status: 400 });
    }

    if (body.status) {
      const updated = await updateJobApplicationStatus(jobId, body.status);
      if (!updated) {
        return NextResponse.json({ error: 'Job application not found' }, { status: 404 });
      }
      return NextResponse.json(updated);
    } else {
      const updated = await updateJobApplication(jobId, body);
      if (!updated) {
        return NextResponse.json({ error: 'Job application not found' }, { status: 404 });
      }
      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error('Error updating job application:', error);
    return NextResponse.json({ error: 'Failed to update job application' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await deleteJobApplication(jobId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job application:', error);
    return NextResponse.json({ error: 'Failed to delete job application' }, { status: 500 });
  }
}
