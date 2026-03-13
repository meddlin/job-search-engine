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
    const { company_name, position_title, source_type, status, salary_range, job_url, notes } = body;

    if (!company_name || !position_title || !source_type || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['direct', 'recruiter'].includes(source_type)) {
      return NextResponse.json({ error: 'Invalid source_type' }, { status: 400 });
    }

    if (!['initiation', 'phone_screen', 'apply', 'interviewing', 'offer_accept'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const newJob = await createJobApplication({
      company_name,
      position_title,
      source_type,
      status,
      salary_range,
      job_url,
      notes,
    });
    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error('Error creating job application:', error);
    return NextResponse.json({ error: 'Failed to create job application' }, { status: 500 });
  }
}
