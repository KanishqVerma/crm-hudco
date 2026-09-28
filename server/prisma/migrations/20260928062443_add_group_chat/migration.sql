-- AlterTable
ALTER TABLE `tbl_crm_conversation` ADD COLUMN `isGroup` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `name` VARCHAR(191) NULL;
