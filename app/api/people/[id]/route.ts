import { NextResponse } from 'next/server';
import { getPersonById, updatePerson, deletePerson } from '@/lib/people';

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

    const person = await getPersonById(personId);
    
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
    const { first_name, last_name, email, phone, company, notes } = body;

    if (!first_name || !last_name || !email || !phone || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedPerson = await updatePerson(personId, { 
      first_name, 
      last_name, 
      email, 
      phone, 
      company, 
      notes: notes || '' 
    });
    
    if (!updatedPerson) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

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

    await deletePerson(personId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
