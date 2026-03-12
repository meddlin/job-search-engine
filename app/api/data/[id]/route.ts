import { NextResponse } from 'next/server';
import { getDataEntryById, updateDataEntry, deleteDataEntry } from '@/lib/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = parseInt(id, 10);
    
    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const entry = await getDataEntryById(entryId);
    
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching data entry:', error);
    return NextResponse.json({ error: 'Failed to fetch data entry' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = parseInt(id, 10);
    
    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, company_info, url, industry } = body;

    if (!name || !company_info || !url || !industry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedEntry = await updateDataEntry(entryId, { name, company_info, url, industry });
    
    if (!updatedEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error updating data entry:', error);
    return NextResponse.json({ error: 'Failed to update data entry' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = parseInt(id, 10);
    
    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await deleteDataEntry(entryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting data entry:', error);
    return NextResponse.json({ error: 'Failed to delete data entry' }, { status: 500 });
  }
}
