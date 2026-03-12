import { NextResponse } from 'next/server';
import { getAllDataEntries, createDataEntry } from '@/lib/data';
import { ensureSeeded } from '@/lib/init-db';

export async function GET() {
  try {
    await ensureSeeded();
    const entries = await getAllDataEntries();
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching data entries:', error);
    return NextResponse.json({ error: 'Failed to fetch data entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { name, company_info, url, industry } = body;

    if (!name || !company_info || !url || !industry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newEntry = await createDataEntry({ name, company_info, url, industry });
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating data entry:', error);
    return NextResponse.json({ error: 'Failed to create data entry' }, { status: 500 });
  }
}
