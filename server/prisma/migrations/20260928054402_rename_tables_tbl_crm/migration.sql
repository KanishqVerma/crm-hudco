/*
  Warnings:

  - You are about to drop the `conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversationparticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subtask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `taskassignee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `todo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `conversationparticipant` DROP FOREIGN KEY `ConversationParticipant_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `conversationparticipant` DROP FOREIGN KEY `ConversationParticipant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `subtask` DROP FOREIGN KEY `Subtask_assignedTo_fkey`;

-- DropForeignKey
ALTER TABLE `subtask` DROP FOREIGN KEY `Subtask_taskId_fkey`;

-- DropForeignKey
ALTER TABLE `taskassignee` DROP FOREIGN KEY `TaskAssignee_taskId_fkey`;

-- DropForeignKey
ALTER TABLE `taskassignee` DROP FOREIGN KEY `TaskAssignee_userId_fkey`;

-- DropForeignKey
ALTER TABLE `todo` DROP FOREIGN KEY `Todo_userId_fkey`;

-- DropTable
DROP TABLE `conversation`;

-- DropTable
DROP TABLE `conversationparticipant`;

-- DropTable
DROP TABLE `message`;

-- DropTable
DROP TABLE `subtask`;

-- DropTable
DROP TABLE `task`;

-- DropTable
DROP TABLE `taskassignee`;

-- DropTable
DROP TABLE `todo`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `tbl_crm_user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'employee',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tbl_crm_user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_crm_task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `deadline` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_crm_task_assignee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `tbl_crm_task_assignee_taskId_userId_key`(`taskId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_crm_subtask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `assignedTo` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_crm_todo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `dueDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_crm_conversation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_crm_conversationParticipant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `lastReadAt` DATETIME(3) NULL,

    UNIQUE INDEX `tbl_crm_conversationParticipant_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_crm_message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tbl_crm_task_assignee` ADD CONSTRAINT `tbl_crm_task_assignee_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tbl_crm_task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_task_assignee` ADD CONSTRAINT `tbl_crm_task_assignee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tbl_crm_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_subtask` ADD CONSTRAINT `tbl_crm_subtask_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tbl_crm_task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_subtask` ADD CONSTRAINT `tbl_crm_subtask_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `tbl_crm_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_todo` ADD CONSTRAINT `tbl_crm_todo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tbl_crm_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_conversationParticipant` ADD CONSTRAINT `tbl_crm_conversationParticipant_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `tbl_crm_conversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_conversationParticipant` ADD CONSTRAINT `tbl_crm_conversationParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tbl_crm_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_message` ADD CONSTRAINT `tbl_crm_message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `tbl_crm_conversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_crm_message` ADD CONSTRAINT `tbl_crm_message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `tbl_crm_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
