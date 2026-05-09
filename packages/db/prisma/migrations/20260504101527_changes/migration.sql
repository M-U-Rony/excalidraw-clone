/*
  Warnings:

  - You are about to drop the column `messages` on the `Chat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "messages",
ADD COLUMN     "shapes" TEXT[];
