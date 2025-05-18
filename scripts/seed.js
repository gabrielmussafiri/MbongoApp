const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.agent.createMany({
    data: [
      {
        name: 'Admin',
        country: 'DRC',
        contact: '+243000000000',
      },
      {
        name: 'Life',
        country: 'DRC',
        contact: '+243111111111',
      },
      {
        name: 'Godlive',
        country: 'RSA',
        contact: '+27720000000',
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 