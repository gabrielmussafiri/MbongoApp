-- DropForeignKey
ALTER TABLE "SubAccount" DROP CONSTRAINT "SubAccount_agentId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_agentId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "description" TEXT;

-- AddForeignKey
ALTER TABLE "SubAccount" ADD CONSTRAINT "SubAccount_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
