const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const agents = await prisma.agent.findMany();

  let updated = 0;
  console.log('--- Auto User-Agent Link Fixer ---');
  for (const user of users) {
    // Try to match by email (case-insensitive) to agent.contact or agent.email (if exists)
    const match = agents.find(a =>
      (a.contact && a.contact.toLowerCase() === user.email.toLowerCase()) ||
      (a.email && a.email.toLowerCase() === user.email.toLowerCase())
    );
    if (match && user.agentId !== match.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { agentId: match.id }
      });
      console.log(`Linked user ${user.email} to agent ${match.name} (${match.country}) [${match.id}]`);
      updated++;
    } else if (!match) {
      console.log(`No agent match for user ${user.email}`);
    } else {
      console.log(`User ${user.email} already linked to agent ${match.name} (${match.country})`);
    }
  }
  console.log(`\nAuto-linking complete. ${updated} user(s) updated.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
}); 