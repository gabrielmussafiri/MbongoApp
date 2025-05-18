-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_destAccountId_fkey";

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "destAccountId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_destAccountId_fkey" FOREIGN KEY ("destAccountId") REFERENCES "SubAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
