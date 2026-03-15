import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const entries = await prisma.dataEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching data entries:', error);
    return NextResponse.json({ error: 'Failed to fetch data entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, companyInfo, url, industry } = body;

    if (!name || !companyInfo || !url || !industry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newEntry = await prisma.dataEntry.create({
      data: {
        name,
        companyInfo,
        url,
        industry,
      },
    });
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating data entry:', error);
    return NextResponse.json({ error: 'Failed to create data entry' }, { status: 500 });
  }
}
