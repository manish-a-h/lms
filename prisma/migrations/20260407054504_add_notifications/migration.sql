/*
  Warnings:

  - You are about to alter the column `amount` on the `SalaryComponent` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `grossSalary` on the `SalarySlip` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `netSalary` on the `SalarySlip` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEAVE_SUBMITTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED', 'LEAVE_REMINDER', 'SYSTEM');

-- AlterTable
ALTER TABLE "SalaryComponent" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "SalarySlip" ALTER COLUMN "grossSalary" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "netSalary" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "SalarySlipLineItem" (
    "id" TEXT NOT NULL,
    "salarySlipId" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "SalaryComponentType" NOT NULL,

    CONSTRAINT "SalarySlipLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalarySlipLineItem_salarySlipId_idx" ON "SalarySlipLineItem"("salarySlipId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SalarySlipLineItem" ADD CONSTRAINT "SalarySlipLineItem_salarySlipId_fkey" FOREIGN KEY ("salarySlipId") REFERENCES "SalarySlip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
