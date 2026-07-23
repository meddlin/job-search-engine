import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();

    if (body.status && !['initiation', 'phone_screen', 'apply', 'interviewing', 'offer_accept', 'rejected'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (body.remote && body.remote !== '' && !['yes', 'no', 'hybrid'].includes(body.remote)) {
      return NextResponse.json({ error: 'Invalid remote value' }, { status: 400 });
    }

    const existing = await prisma.jobApplication.findUnique({
      where: { id: jobId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Job application not found' }, { status: 404 });
    }

    const updated = await prisma.jobApplication.update({
      where: { id: jobId },
      data: {
        companyName: body.companyName ?? existing.companyName,
        positionTitle: body.positionTitle ?? existing.positionTitle,
        status: body.status ?? existing.status,
        remote: body.remote ?? existing.remote,
        applied: body.applied ?? existing.applied,
        notes: body.notes ?? existing.notes,
        jobUrl: body.jobUrl ?? existing.jobUrl,
        jobDescription: body.jobDescription ?? existing.jobDescription,
        recruiterName: body.recruiterName ?? existing.recruiterName,
        recruitingAgency: body.recruitingAgency ?? existing.recruitingAgency,
        recruiterEmail: body.recruiterEmail ?? existing.recruiterEmail,
        recruiterPhone: body.recruiterPhone ?? existing.recruiterPhone,
        recruiterLinkedin: body.recruiterLinkedin ?? existing.recruiterLinkedin,
      },
    });

    return NextResponse.json(updated);
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

    await prisma.jobApplication.delete({
      where: { id: jobId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job application:', error);
    return NextResponse.json({ error: 'Failed to delete job application' }, { status: 500 });
  }
}
