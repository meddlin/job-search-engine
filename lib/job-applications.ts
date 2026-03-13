import { sql } from './db';

export interface JobApplication {
  id: number;
  company_name: string;
  position_title: string;
  source_type: 'direct' | 'recruiter';
  status: 'initiation' | 'phone_screen' | 'apply' | 'interviewing' | 'offer_accept';
  salary_range: string | null;
  job_url: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJobApplicationInput {
  company_name: string;
  position_title: string;
  source_type: 'direct' | 'recruiter';
  status: 'initiation' | 'phone_screen' | 'apply' | 'interviewing' | 'offer_accept';
  salary_range?: string;
  job_url?: string;
  notes?: string;
}

export async function getAllJobApplications(): Promise<JobApplication[]> {
  const result = await sql`
    SELECT * FROM job_applications ORDER BY updated_at DESC
  `;
  return result as unknown as JobApplication[];
}

export async function getJobApplicationById(id: number): Promise<JobApplication | null> {
  const result = await sql`
    SELECT * FROM job_applications WHERE id = ${id}
  `;
  return result.length > 0 ? (result[0] as unknown as JobApplication) : null;
}

export async function createJobApplication(input: CreateJobApplicationInput): Promise<JobApplication> {
  const result = await sql`
    INSERT INTO job_applications (
      company_name,
      position_title,
      source_type,
      status,
      salary_range,
      job_url,
      notes
    ) VALUES (
      ${input.company_name},
      ${input.position_title},
      ${input.source_type},
      ${input.status},
      ${input.salary_range || null},
      ${input.job_url || null},
      ${input.notes || null}
    )
    RETURNING *
  `;
  return result[0] as unknown as JobApplication;
}

export async function updateJobApplication(
  id: number,
  input: Partial<CreateJobApplicationInput>
): Promise<JobApplication | null> {
  const existing = await getJobApplicationById(id);
  if (!existing) return null;

  const updated = await sql`
    UPDATE job_applications SET
      company_name = ${input.company_name ?? existing.company_name},
      position_title = ${input.position_title ?? existing.position_title},
      source_type = ${input.source_type ?? existing.source_type},
      status = ${input.status ?? existing.status},
      salary_range = ${input.salary_range ?? existing.salary_range},
      job_url = ${input.job_url ?? existing.job_url},
      notes = ${input.notes ?? existing.notes},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  return updated[0] as unknown as JobApplication;
}

export async function updateJobApplicationStatus(
  id: number,
  status: JobApplication['status']
): Promise<JobApplication | null> {
  const result = await sql`
    UPDATE job_applications SET
      status = ${status},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  return result.length > 0 ? (result[0] as unknown as JobApplication) : null;
}

export async function deleteJobApplication(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM job_applications WHERE id = ${id}
  `;
  return true;
}
