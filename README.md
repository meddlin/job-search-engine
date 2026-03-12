# Job Search Engine

A Next.js application with PostgreSQL database, featuring table interfaces for managing data entries and people.

## Prerequisites

- [Docker](https://www.docker.com/get-started) (with Docker Compose)
- [Node.js](https://nodejs.org/) 18+ (for local development)

## Quick Start

### 1. Start All Services

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port `5432`
- **pgAdmin** on port `5050`
- **Next.js** on port `3000`

### 2. Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| Next.js App | http://localhost:3000 | - |
| pgAdmin | http://localhost:5050 | admin@jobsearch.local / admin123 |
| PostgreSQL | localhost:5432 | jobsearch / jobsearch123 |

### 3. View the Tables

- **Data Table**: http://localhost:3000/data
- **People Table**: http://localhost:3000/people

---

## Reset the Database

To delete all data and reload with the initial seed data:

```bash
curl -X DELETE http://localhost:3000/api/seed
```

Or click the reset button (if added to the UI).

---

## Development (Local)

If you want to run the Next.js app locally while using Docker for the database:

 Start Only PostgreSQL### 1. and pgAdmin

```bash
docker-compose up postgres pgadmin
```

### 2. Update .env (if needed)

```env
DATABASE_URL=postgres://jobsearch:jobsearch123@localhost:5432/jobsearch
```

### 3. Run Next.js Locally

```bash
npm run dev
```

---

## Docker Commands

### Stop All Services

```bash
docker-compose down
```

### Stop and Remove Data Volumes

```bash
docker-compose down -v
```

### View Logs

```bash
docker-compose logs -f
```

### View Logs for a Specific Service

```bash
docker-compose logs -f postgres
docker-compose logs -f pgadmin
docker-compose logs -f nextjs
```

---

## Database Schema

### Table: `data_entries`

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Entry name |
| company_info | VARCHAR(255) | Company information |
| url | VARCHAR(500) | Website URL |
| industry | VARCHAR(255) | Industry category |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Table: `people`

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| first_name | VARCHAR(255) | First name |
| last_name | VARCHAR(255) | Last name |
| email | VARCHAR(255) | Email address |
| phone | VARCHAR(50) | Phone number |
| company | VARCHAR(255) | Company name |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

---

## API Endpoints

### Data Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/data | Get all data entries |
| POST | /api/data | Create new entry |
| GET | /api/data/[id] | Get single entry |
| PUT | /api/data/[id] | Update entry |
| DELETE | /api/data/[id] | Delete entry |

### People

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/people | Get all people |
| POST | /api/people | Create new person |
| GET | /api/people/[id] | Get single person |
| PUT | /api/people/[id] | Update person |
| DELETE | /api/people/[id] | Delete person |

### Database Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | /api/seed | Reset and reseed database |

---

## Seed Data

The database comes pre-populated with 12 sample entries for each table:

### Data Entries
- John Doe - Acme Corp (Technology)
- Jane Smith - TechStart Inc (Software)
- Bob Johnson - Global Solutions (Consulting)
- ...and 9 more

### People
- John Doe - CEO at Acme Corp
- Jane Smith - CTO at TechStart Inc
- Bob Johnson - Project Manager at Global Solutions
- ...and 9 more
