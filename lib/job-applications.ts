import { sql } from './db';

export interface JobApplication {
  id: number;
  company_name: string;
  position_title: string;
  status: 'initiation' | 'phone_screen' | 'apply' | 'interviewing' | 'offer_accept';
  remote: 'yes' | 'no' | 'hybrid';
  applied: boolean;
  notes: string | null;
  job_url: string | null;
  job_description: string | null;
  recruiter_name: string | null;
  recruiting_agency: string | null;
  recruiter_email: string | null;
  recruiter_phone: string | null;
  recruiter_linkedin: string | null;
  date_added: Date;
  updated_at: Date;
}

export interface CreateJobApplicationInput {
  company_name: string;
  position_title: string;
  status: 'initiation' | 'phone_screen' | 'apply' | 'interviewing' | 'offer_accept';
  remote: 'yes' | 'no' | 'hybrid';
  applied?: boolean;
  notes?: string;
  job_url?: string;
  job_description?: string;
  recruiter_name?: string;
  recruiting_agency?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  recruiter_linkedin?: string;
}

export async function getAllJobApplications(): Promise<JobApplication[]> {
  const result = await sql`
    SELECT * FROM job_applications ORDER BY date_added DESC
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
      recruiter_linkedin
    ) VALUES (
      ${input.company_name || null},
      ${input.position_title || null},
      ${input.status || 'initiation'},
      ${input.remote || null},
      ${input.applied ?? false},
      ${input.notes || null},
      ${input.job_url || null},
      ${input.job_description || null},
      ${input.recruiter_name || null},
      ${input.recruiting_agency || null},
      ${input.recruiter_email || null},
      ${input.recruiter_phone || null},
      ${input.recruiter_linkedin || null}
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
      company_name = ${input.company_name !== undefined ? (input.company_name || null) : existing.company_name},
      position_title = ${input.position_title !== undefined ? (input.position_title || null) : existing.position_title},
      status = ${input.status ?? existing.status},
      remote = ${input.remote !== undefined ? (input.remote || null) : existing.remote},
      applied = ${input.applied !== undefined ? input.applied : existing.applied},
      notes = ${input.notes !== undefined ? (input.notes || null) : existing.notes},
      job_url = ${input.job_url !== undefined ? (input.job_url || null) : existing.job_url},
      job_description = ${input.job_description !== undefined ? (input.job_description || null) : existing.job_description},
      recruiter_name = ${input.recruiter_name !== undefined ? (input.recruiter_name || null) : existing.recruiter_name},
      recruiting_agency = ${input.recruiting_agency !== undefined ? (input.recruiting_agency || null) : existing.recruiting_agency},
      recruiter_email = ${input.recruiter_email !== undefined ? (input.recruiter_email || null) : existing.recruiter_email},
      recruiter_phone = ${input.recruiter_phone !== undefined ? (input.recruiter_phone || null) : existing.recruiter_phone},
      recruiter_linkedin = ${input.recruiter_linkedin !== undefined ? (input.recruiter_linkedin || null) : existing.recruiter_linkedin},
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
  await sql`
    DELETE FROM job_applications WHERE id = ${id}
  `;
  return true;
}
