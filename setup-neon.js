#!/usr/bin/env node

/**
 * Setup Neon Database
 * Script ini membantu setup database Neon untuk development/production
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Setup Neon Database for apssayamgeprek\n');

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

const main = async () => {
  try {
    // 1. Ask for Neon connection string
    const connectionString = await askQuestion(
      'Masukkan Neon Connection String (misal: postgresql://user:pass@host/db?sslmode=require):\n'
    );

    if (!connectionString) {
      console.log('❌ Connection string diperlukan!');
      rl.close();
      return;
    }

    // 2. Validate connection string format
    if (!connectionString.startsWith('postgresql://')) {
      console.log('❌ Connection string harus dimulai dengan postgresql://');
      rl.close();
      return;
    }

    // 3. Ask for NEXTAUTH_SECRET
    const secret = await askQuestion(
      'Masukkan NEXTAUTH_SECRET (kosongkan untuk generate otomatis):\n'
    );

    // Generate secret if not provided
    const authSecret = secret || require('crypto').randomBytes(32).toString('base64');

    // 4. Determine environment
    const env = await askQuestion(
      'Environment (development/production) [default: development]:\n'
    );

    const isProduction = env.toLowerCase() === 'production';
    const envFile = isProduction ? '.env.production' : '.env';
    const nextAuthUrl = isProduction
      ? 'https://apssayamgeprek.vercel.app'
      : 'http://localhost:3000';

    // 5. Create .env file
    const envContent = `# Database - Neon PostgreSQL
DATABASE_URL=${connectionString}

# NextAuth
NEXTAUTH_URL=${nextAuthUrl}
NEXTAUTH_SECRET=${authSecret}

# Other Environment Variables
`;

    fs.writeFileSync(envFile, envContent);
    console.log(`\n✅ Environment file created: ${envFile}`);

    // 6. Instructions
    console.log('\n📋 Langkah selanjutnya:');
    console.log('1. Install dependencies: bun install');
    console.log('2. Generate Prisma Client: bun run db:generate');
    console.log('3. Push schema to database: bun run db:push');
    console.log('4. Start development server: bun run dev');

    if (isProduction) {
      console.log('\n🚀 Untuk deployment ke Vercel:');
      console.log('1. Copy DATABASE_URL ke environment variables Vercel');
      console.log('2. Copy NEXTAUTH_SECRET ke environment variables Vercel');
      console.log('3. Copy NEXTAUTH_URL ke environment variables Vercel');
      console.log('4. Deploy ke Vercel');
    }

    console.log('\n✨ Setup selesai!\n');

    rl.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
};

main();
