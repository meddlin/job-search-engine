import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, company, notes } = body;

    if (!firstName || !lastName || !email || !phone || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPerson = await prisma.person.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        notes,
      },
    });
    return NextResponse.json(newPerson, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
