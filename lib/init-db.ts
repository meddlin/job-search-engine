import { sql } from './db';

let initialized = false;
let seedPerformed = false;

export async function ensureTablesExist() {
  if (initialized) return;

  console.log('Initializing database tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS data_entries (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company_info VARCHAR(255) NOT NULL,
      url VARCHAR(500) NOT NULL,
      industry VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS people (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      company VARCHAR(255) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  initialized = true;
  console.log('Database tables initialized successfully');
}

export async function ensureSeeded() {
  await ensureTablesExist();
  
  if (seedPerformed) return;

  const dataCount = await sql`SELECT COUNT(*) as count FROM data_entries`;
  const peopleCount = await sql`SELECT COUNT(*) as count FROM people`;

  if (Number(dataCount[0].count) === 0 || Number(peopleCount[0].count) === 0) {
    console.log('Seeding initial data...');

    const seedDataEntries = [
      { name: 'John Doe', company_info: 'Acme Corp', url: 'https://acme.com', industry: 'Technology' },
      { name: 'Jane Smith', company_info: 'TechStart Inc', url: 'https://techstart.io', industry: 'Software' },
      { name: 'Bob Johnson', company_info: 'Global Solutions', url: 'https://globalsolutions.com', industry: 'Consulting' },
      { name: 'Alice Brown', company_info: 'DataFlow LLC', url: 'https://dataflow.dev', industry: 'Data Analytics' },
      { name: 'Charlie Wilson', company_info: 'CloudNine', url: 'https://cloudnine.cloud', industry: 'Cloud Services' },
      { name: 'Diana Martinez', company_info: 'InnovateTech', url: 'https://innovatetech.co', industry: 'Technology' },
      { name: 'Ethan Lee', company_info: 'CyberSafe', url: 'https://cybersafe.io', industry: 'Cybersecurity' },
      { name: 'Fiona Garcia', company_info: 'AI Labs', url: 'https://ailabs.ai', industry: 'Artificial Intelligence' },
      { name: 'George Taylor', company_info: 'QuantumSoft', url: 'https://quantumsoft.com', industry: 'Software' },
      { name: 'Hannah White', company_info: 'NetWorks Inc', url: 'https://networks.inc', industry: 'Networking' },
      { name: 'Ian Clark', company_info: 'WebFlow', url: 'https://webflow.io', industry: 'Web Development' },
      { name: 'Julia Hall', company_info: 'MobileFirst', url: 'https://mobilefirst.app', industry: 'Mobile Apps' },
    ];

    const seedPeople = [
      { first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', phone: '555-0101', company: 'Acme Corp', notes: 'CEO' },
      { first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', phone: '555-0102', company: 'TechStart Inc', notes: 'CTO' },
      { first_name: 'Bob', last_name: 'Johnson', email: 'bob.johnson@example.com', phone: '555-0103', company: 'Global Solutions', notes: 'Project Manager' },
      { first_name: 'Alice', last_name: 'Brown', email: 'alice.brown@example.com', phone: '555-0104', company: 'DataFlow LLC', notes: 'Data Analyst' },
      { first_name: 'Charlie', last_name: 'Wilson', email: 'charlie.wilson@example.com', phone: '555-0105', company: 'CloudNine', notes: 'DevOps Engineer' },
      { first_name: 'Diana', last_name: 'Martinez', email: 'diana.martinez@example.com', phone: '555-0106', company: 'InnovateTech', notes: 'Product Manager' },
      { first_name: 'Ethan', last_name: 'Lee', email: 'ethan.lee@example.com', phone: '555-0107', company: 'CyberSafe', notes: 'Security Specialist' },
      { first_name: 'Fiona', last_name: 'Garcia', email: 'fiona.garcia@example.com', phone: '555-0108', company: 'AI Labs', notes: 'ML Engineer' },
      { first_name: 'George', last_name: 'Taylor', email: 'george.taylor@example.com', phone: '555-0109', company: 'QuantumSoft', notes: 'Software Engineer' },
      { first_name: 'Hannah', last_name: 'White', email: 'hannah.white@example.com', phone: '555-0110', company: 'NetWorks Inc', notes: 'Network Admin' },
      { first_name: 'Ian', last_name: 'Clark', email: 'ian.clark@example.com', phone: '555-0111', company: 'WebFlow', notes: 'Frontend Developer' },
      { first_name: 'Julia', last_name: 'Hall', email: 'julia.hall@example.com', phone: '555-0112', company: 'MobileFirst', notes: 'Mobile Developer' },
    ];

    for (const entry of seedDataEntries) {
      await sql`
        INSERT INTO data_entries (name, company_info, url, industry)
        VALUES (${entry.name}, ${entry.company_info}, ${entry.url}, ${entry.industry})
      `;
    }

    for (const person of seedPeople) {
      await sql`
        INSERT INTO people (first_name, last_name, email, phone, company, notes)
        VALUES (${person.first_name}, ${person.last_name}, ${person.email}, ${person.phone}, ${person.company}, ${person.notes})
      `;
    }

    seedPerformed = true;
    console.log('Database seeded successfully');
  }
}

export function resetSeedFlag() {
  seedPerformed = false;
}
