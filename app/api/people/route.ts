import { NextResponse } from 'next/server';
import { getAllPeople, createPerson } from '@/lib/people';
import { ensureSeeded } from '@/lib/init-db';

export async function GET() {
  try {
    await ensureSeeded();
    const people = await getAllPeople();
    return NextResponse.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { first_name, last_name, email, phone, company, notes } = body;

    if (!first_name || !last_name || !email || !phone || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPerson = await createPerson({ first_name, last_name, email, phone, company, notes: notes || '' });
    return NextResponse.json(newPerson, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
