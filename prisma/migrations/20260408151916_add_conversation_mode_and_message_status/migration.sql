-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'bot',
ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "sentBy" TEXT;
