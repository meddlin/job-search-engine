import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.jobApplication.findMany({
      orderBy: { dateAdded: 'desc' },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json({ error: 'Failed to fetch job applications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      positionTitle,
      status,
      remote,
      applied,
      notes,
      jobUrl,
      jobDescription,
      recruiterName,
      recruitingAgency,
      recruiterEmail,
      recruiterPhone,
      recruiterLinkedin,
    } = body;

    if (status && !['initiation', 'phone_screen', 'apply', 'interviewing', 'offer_accept', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (remote && !['yes', 'no', 'hybrid'].includes(remote)) {
      return NextResponse.json({ error: 'Invalid remote value' }, { status: 400 });
    }

    const newJob = await prisma.jobApplication.create({
      data: {
        companyName,
        positionTitle,
        status: status || 'initiation',
        remote,
        applied: applied || false,
        notes,
        jobUrl,
        jobDescription,
        recruiterName,
        recruitingAgency,
        recruiterEmail,
        recruiterPhone,
        recruiterLinkedin,
      },
    });
    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error('Error creating job application:', error);
    return NextResponse.json({ error: 'Failed to create job application' }, { status: 500 });
  }
}
