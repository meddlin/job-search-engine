import { sql } from './db';

export interface DataEntry {
  id: number;
  name: string;
  company_info: string;
  url: string;
  industry: string;
  created_at: Date;
  updated_at: Date;
}

export async function getAllDataEntries(): Promise<DataEntry[]> {
  const result = await sql`
    SELECT id, name, company_info, url, industry, created_at, updated_at
    FROM data_entries
    ORDER BY id ASC
  `;
  return result.length > 0 ? [...result] as unknown as DataEntry[] : [];
}

export async function getDataEntryById(id: number): Promise<DataEntry | null> {
  const result = await sql`
    SELECT id, name, company_info, url, industry, created_at, updated_at
    FROM data_entries
    WHERE id = ${id}
  `;
  return result.length > 0 ? (result[0] as DataEntry) : null;
}

export async function createDataEntry(
  entry: Omit<DataEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<DataEntry> {
  const result = await sql`
    INSERT INTO data_entries (name, company_info, url, industry)
    VALUES (${entry.name}, ${entry.company_info}, ${entry.url}, ${entry.industry})
    RETURNING id, name, company_info, url, industry, created_at, updated_at
  `;
  return result[0] as DataEntry;
}

export async function updateDataEntry(
  id: number,
  entry: Omit<DataEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<DataEntry | null> {
  const result = await sql`
    UPDATE data_entries
    SET name = ${entry.name},
        company_info = ${entry.company_info},
        url = ${entry.url},
        industry = ${entry.industry},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, name, company_info, url, industry, created_at, updated_at
  `;
  return result.length > 0 ? (result[0] as DataEntry) : null;
}

export async function deleteDataEntry(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM data_entries
    WHERE id = ${id}
  `;
  return true;
}
