import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function resetDatabase() {
  await prisma.dataEntry.deleteMany();
  await prisma.person.deleteMany();

  const seedDataEntries = [
    { name: 'John Doe', companyInfo: 'Acme Corp', url: 'https://acme.com', industry: 'Technology' },
    { name: 'Jane Smith', companyInfo: 'TechStart Inc', url: 'https://techstart.io', industry: 'Software' },
    { name: 'Bob Johnson', companyInfo: 'Global Solutions', url: 'https://globalsolutions.com', industry: 'Consulting' },
    { name: 'Alice Brown', companyInfo: 'DataFlow LLC', url: 'https://dataflow.dev', industry: 'Data Analytics' },
    { name: 'Charlie Wilson', companyInfo: 'CloudNine', url: 'https://cloudnine.cloud', industry: 'Cloud Services' },
    { name: 'Diana Martinez', companyInfo: 'InnovateTech', url: 'https://innovatetech.co', industry: 'Technology' },
    { name: 'Ethan Lee', companyInfo: 'CyberSafe', url: 'https://cybersafe.io', industry: 'Cybersecurity' },
    { name: 'Fiona Garcia', companyInfo: 'AI Labs', url: 'https://ailabs.ai', industry: 'Artificial Intelligence' },
    { name: 'George Taylor', companyInfo: 'QuantumSoft', url: 'https://quantumsoft.com', industry: 'Software' },
    { name: 'Hannah White', companyInfo: 'NetWorks Inc', url: 'https://networks.inc', industry: 'Networking' },
    { name: 'Ian Clark', companyInfo: 'WebFlow', url: 'https://webflow.io', industry: 'Web Development' },
    { name: 'Julia Hall', companyInfo: 'MobileFirst', url: 'https://mobilefirst.app', industry: 'Mobile Apps' },
  ];

  const seedPeople = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '555-0101', company: 'Acme Corp', notes: 'CEO' },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phone: '555-0102', company: 'TechStart Inc', notes: 'CTO' },
    { firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@example.com', phone: '555-0103', company: 'Global Solutions', notes: 'Project Manager' },
    { firstName: 'Alice', lastName: 'Brown', email: 'alice.brown@example.com', phone: '555-0104', company: 'DataFlow LLC', notes: 'Data Analyst' },
    { firstName: 'Charlie', lastName: 'Wilson', email: 'charlie.wilson@example.com', phone: '555-0105', company: 'CloudNine', notes: 'DevOps Engineer' },
    { firstName: 'Diana', lastName: 'Martinez', email: 'diana.martinez@example.com', phone: '555-0106', company: 'InnovateTech', notes: 'Product Manager' },
    { firstName: 'Ethan', lastName: 'Lee', email: 'ethan.lee@example.com', phone: '555-0107', company: 'CyberSafe', notes: 'Security Specialist' },
    { firstName: 'Fiona', lastName: 'Garcia', email: 'fiona.garcia@example.com', phone: '555-0108', company: 'AI Labs', notes: 'ML Engineer' },
    { firstName: 'George', lastName: 'Taylor', email: 'george.taylor@example.com', phone: '555-0109', company: 'QuantumSoft', notes: 'Software Engineer' },
    { firstName: 'Hannah', lastName: 'White', email: 'hannah.white@example.com', phone: '555-0110', company: 'NetWorks Inc', notes: 'Network Admin' },
    { firstName: 'Ian', lastName: 'Clark', email: 'ian.clark@example.com', phone: '555-0111', company: 'WebFlow', notes: 'Frontend Developer' },
    { firstName: 'Julia', lastName: 'Hall', email: 'julia.hall@example.com', phone: '555-0112', company: 'MobileFirst', notes: 'Mobile Developer' },
  ];

  for (const entry of seedDataEntries) {
    await prisma.dataEntry.create({ data: entry });
  }

  for (const person of seedPeople) {
    await prisma.person.create({ data: person });
  }
}

export async function DELETE() {
  try {
    await resetDatabase();
    return NextResponse.json({ success: true, message: 'Database reset and seeded successfully' });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}
