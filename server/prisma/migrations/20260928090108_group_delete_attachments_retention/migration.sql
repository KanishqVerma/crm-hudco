/*
  Warnings:

  - You are about to drop the `tbl_crm_conversationparticipant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `tbl_crm_conversationparticipant` DROP FOREIGN KEY `tbl_crm_conversationParticipant_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `tbl_crm_conversationparticipant` DROP FOREIGN KEY `tbl_crm_conversationParticipant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `tbl_crm_message` DROP FOREIGN KEY `tbl_crm_message_conversationId_fkey`;

-- DropIndex
DROP INDEX `tbl_crm_message_conversationId_fkey` ON `tbl_crm_message`;

-- AlterTable
ALTER TABLE `tbl_crm_conversation` ADD COLUMN `createdBy` INTEGER NULL;

-- DropTable
DROP TABLE `tbl_crm_conversationparticipant`;

-- CreateTable
CREATE TABLE `tbl_crm_conversation_participant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `lastReadAt` DATETIME(3) NULL,
    `lastNotifiedAt` DATETIME(3) NULL,

    UNIQUE INDEX `tbl_crm_conversation_participant_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_crm_attachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `data` LONGBLOB NOT NULL,

    UNIQUE INDEX `tbl_crm_attachment_messageId_key`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `tbl_crm_message_createdAt_idx` ON `tbl_crm_message`(`createdAt`);

-- AddForeignKey
ALTER TABLE `tbl_crm_conversation_participant` ADD CONSTRAINT `tbl_crm_conversation_participant_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `tbl_crm_conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_conversation_participant` ADD CONSTRAINT `tbl_crm_conversation_participant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tbl_crm_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_message` ADD CONSTRAINT `tbl_crm_message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `tbl_crm_conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_attachment` ADD CONSTRAINT `tbl_crm_attachment_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `tbl_crm_message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
