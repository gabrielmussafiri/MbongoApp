const { PrismaClient } = require('@prisma/client');
const inquirer = require('inquirer');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const agents = await prisma.agent.findMany();

  console.log('--- User-Agent Link Fixer ---');
  for (const user of users) {
    const currentAgent = agents.find(a => a.id === user.agentId);
    console.log(`\nUser: ${user.email} (Current agent: ${currentAgent ? currentAgent.name + ' (' + currentAgent.country + ')' : 'None'})`);
    const { agentId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'agentId',
        message: 'Select the correct agent for this user:',
        choices: [
          { name: 'None (no agent)', value: null },
          ...agents.map(a => ({ name: `${a.name} (${a.country}) [${a.id}]`, value: a.id }))
        ],
        default: user.agentId || null
      }
    ]);
    if (agentId !== user.agentId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { agentId }
      });
      console.log(`Updated user ${user.email} to agentId: ${agentId}`);
    } else {
      console.log('No change.');
    }
  }
  console.log('\nAll done!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
}); 