import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const entry = await prisma.dataEntry.findUnique({
      where: { id: entryId },
    });
    
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
    const { name, companyInfo, url, industry } = body;

    if (!name || !companyInfo || !url || !industry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.dataEntry.findUnique({
      where: { id: entryId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const updatedEntry = await prisma.dataEntry.update({
      where: { id: entryId },
      data: {
        name: name ?? existing.name,
        companyInfo: companyInfo ?? existing.companyInfo,
        url: url ?? existing.url,
        industry: industry ?? existing.industry,
      },
    });
    
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

    await prisma.dataEntry.delete({
      where: { id: entryId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting data entry:', error);
    return NextResponse.json({ error: 'Failed to delete data entry' }, { status: 500 });
  }
}
