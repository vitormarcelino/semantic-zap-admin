-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "telegramBotToken" TEXT,
ADD COLUMN     "twilioAccountSid" TEXT,
ADD COLUMN     "twilioAuthToken" TEXT,
ADD COLUMN     "whatsappAccessToken" TEXT,
ADD COLUMN     "whatsappPhoneNumberId" TEXT;
