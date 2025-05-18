const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { agent: true } });
  console.log('--- Users and their linked Agents ---');
  for (const user of users) {
    if (user.agent) {
      console.log(
        `User: ${user.email} | Agent: ${user.agent.name} (${user.agent.country}) | agentId: ${user.agent.id} | user.agentId: ${user.agentId}`
      );
    } else {
      console.log(
        `User: ${user.email} | Agent: None | user.agentId: ${user.agentId}`
      );
    }
  }
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
}); 