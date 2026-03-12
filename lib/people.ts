import { sql } from './db';

export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

export async function getAllPeople(): Promise<Person[]> {
  const result = await sql`
    SELECT id, first_name, last_name, email, phone, company, notes, created_at, updated_at
    FROM people
    ORDER BY id ASC
  `;
  return result.length > 0 ? [...result] as unknown as Person[] : [];
}

export async function getPersonById(id: number): Promise<Person | null> {
  const result = await sql`
    SELECT id, first_name, last_name, email, phone, company, notes, created_at, updated_at
    FROM people
    WHERE id = ${id}
  `;
  return result.length > 0 ? (result[0] as unknown as Person) : null;
}

export async function createPerson(
  person: Omit<Person, 'id' | 'created_at' | 'updated_at'>
): Promise<Person> {
  const result = await sql`
    INSERT INTO people (first_name, last_name, email, phone, company, notes)
    VALUES (${person.first_name}, ${person.last_name}, ${person.email}, ${person.phone}, ${person.company}, ${person.notes})
    RETURNING id, first_name, last_name, email, phone, company, notes, created_at, updated_at
  `;
  return result[0] as unknown as Person;
}

export async function updatePerson(
  id: number,
  person: Omit<Person, 'id' | 'created_at' | 'updated_at'>
): Promise<Person | null> {
  const result = await sql`
    UPDATE people
    SET first_name = ${person.first_name},
        last_name = ${person.last_name},
        email = ${person.email},
        phone = ${person.phone},
        company = ${person.company},
        notes = ${person.notes},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, first_name, last_name, email, phone, company, notes, created_at, updated_at
  `;
  return result.length > 0 ? (result[0] as unknown as Person) : null;
}

export async function deletePerson(id: number): Promise<boolean> {
  await sql`
    DELETE FROM people
    WHERE id = ${id}
  `;
  return true;
}
