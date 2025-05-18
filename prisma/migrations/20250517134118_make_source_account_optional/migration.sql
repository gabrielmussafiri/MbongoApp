-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_sourceAccountId_fkey";

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "sourceAccountId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "SubAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
