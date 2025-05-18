const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Find agents by name
  const adminAgent = await prisma.agent.findFirst({ where: { name: 'Admin' } });
  const lifeAgent = await prisma.agent.findFirst({ where: { name: 'Life' } });
  const godliveAgent = await prisma.agent.findFirst({ where: { name: 'Godlive' } });

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('adminpassword', 10),
        role: 'ADMIN',
        agentId: null,
      },
      {
        email: 'life@example.com',
        password: await bcrypt.hash('lifepassword', 10),
        role: 'AGENT',
        agentId: lifeAgent ? lifeAgent.id : null,
      },
      {
        email: 'godlive@example.com',
        password: await bcrypt.hash('godlivepassword', 10),
        role: 'AGENT',
        agentId: godliveAgent ? godliveAgent.id : null,
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