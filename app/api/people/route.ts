import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parsePersonCreateInput, PersonInputError } from '@/lib/people';

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
    const data = parsePersonCreateInput(body);

    const newPerson = await prisma.person.create({
      data,
    });
    return NextResponse.json(newPerson, { status: 201 });
  } catch (error) {
    if (error instanceof PersonInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error creating person:', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
