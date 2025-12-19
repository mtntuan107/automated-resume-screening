# Setup
Ensure you have the following installed:

Node.js (v18 or higher)

Docker Desktop (to run the database)

## Clone

```bash
git clone https://github.com/your-username/ai-resume-screening.git
```

## Install Dependencies

```bash
npm install
```

## Configure Environment Variables
Create a .env file in the root directory and add the following keys:
```bash
# Database Connection (Matches docker-compose.yml)
DATABASE_URL="postgresql://postgres:password@localhost:5432/resume_db?schema=public"

# Google Gemini API Key (Get one at aistudio.google.com)
GEMINI_API_KEY="AIzaSy...YOUR_API_KEY_HERE"
```

## Setup Database with Docker 🐳
We use Docker Compose to spin up a PostgreSQL container instantly.

Ensure you have a docker-compose.yml file in the root (see Appendix below if missing).
```bash
#Run the container:
docker-compose up -d
#Verify the container is running:
docker ps
```

## Generate Prisma Client
```bash
# Generate Prisma Client
npx prisma generate
# Push schema to Database
npx prisma db push
```

## Run the Application
Start the development server:
```bash
npm run dev
```
Open your browser and navigate to: http://localhost:3000