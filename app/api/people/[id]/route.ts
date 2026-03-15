import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);
    
    if (isNaN(personId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const person = await prisma.person.findUnique({
      where: { id: personId },
    });
    
    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);
    
    if (isNaN(personId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, company, notes } = body;

    if (!firstName || !lastName || !email || !phone || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.person.findUnique({
      where: { id: personId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    const updatedPerson = await prisma.person.update({
      where: { id: personId },
      data: {
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        company: company ?? existing.company,
        notes: notes ?? existing.notes,
      },
    });
    
    return NextResponse.json(updatedPerson);
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json({ error: 'Failed to update person' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);
    
    if (isNaN(personId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.person.delete({
      where: { id: personId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
