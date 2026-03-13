import { NextResponse } from 'next/server';
import { getAllJobApplications, createJobApplication } from '@/lib/job-applications';
import { ensureTablesExist } from '@/lib/init-db';

export async function GET() {
  try {
    await ensureTablesExist();
    const jobs = await getAllJobApplications();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json({ error: 'Failed to fetch job applications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTablesExist();
    const body = await request.json();
    const {
      company_name,
      position_title,
      status,
      remote,
      applied,
      notes,
      job_url,
      job_description,
      recruiter_name,
      recruiting_agency,
      recruiter_email,
      recruiter_phone,
      recruiter_linkedin,
    } = body;

    if (!status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (status && !['initiation', 'phone_screen', 'apply', 'interviewing', 'offer_accept'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (remote && !['yes', 'no', 'hybrid'].includes(remote)) {
      return NextResponse.json({ error: 'Invalid remote value' }, { status: 400 });
    }

    const newJob = await createJobApplication({
      company_name,
      position_title,
      status,
      remote,
      applied,
      notes,
      job_url,
      job_description,
      recruiter_name,
      recruiting_agency,
      recruiter_email,
      recruiter_phone,
      recruiter_linkedin,
    });
    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error('Error creating job application:', error);
    return NextResponse.json({ error: 'Failed to create job application' }, { status: 500 });
  }
}
