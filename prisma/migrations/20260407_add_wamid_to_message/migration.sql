-- AlterTable
ALTER TABLE "Message" ADD COLUMN "wamid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Message_wamid_key" ON "Message"("wamid");
