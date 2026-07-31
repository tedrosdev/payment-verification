import { PrismaClient, BankType, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  const passwordHash = await bcrypt.hash('AdminPass123!', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@verify.et' },
    update: {},
    create: {
      email: 'admin@verify.et',
      name: 'System Admin',
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // Seed default Settlement Accounts
  const cbeAccount = await prisma.settlementAccount.upsert({
    where: { bank: BankType.CBE },
    update: {},
    create: {
      bank: BankType.CBE,
      accountNumber: '1000123456789',
      accountSuffix: '6789',
      accountHolderName: 'Verification Admin CBE',
      isActive: true,
    },
  });

  const telebirrAccount = await prisma.settlementAccount.upsert({
    where: { bank: BankType.TELEBIRR },
    update: {},
    create: {
      bank: BankType.TELEBIRR,
      accountNumber: '0911000000',
      accountHolderName: 'Verification Admin Telebirr',
      isActive: true,
    },
  });

  const boaAccount = await prisma.settlementAccount.upsert({
    where: { bank: BankType.BOA },
    update: {},
    create: {
      bank: BankType.BOA,
      accountNumber: '9876543210',
      accountSuffix: '3210',
      accountHolderName: 'Verification Admin BOA',
      isActive: true,
    },
  });

  console.log(`Settlement accounts configured: ${cbeAccount.bank}, ${telebirrAccount.bank}, ${boaAccount.bank}`);

  // Seed initial Batch
  const defaultBatch = await prisma.batch.create({
    data: {
      name: 'Launch Promotional Giveaway 2026',
      ticketPrice: 100.0,
      description: 'Initial promotional batch: 100 ETB per ticket',
    },
  });

  console.log(`Created initial batch: ${defaultBatch.name} (${defaultBatch.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
