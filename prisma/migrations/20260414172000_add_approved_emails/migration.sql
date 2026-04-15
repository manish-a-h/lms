-- CreateTable
CREATE TABLE "ApprovedEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'employee',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovedEmail_email_key" ON "ApprovedEmail"("email");

-- CreateIndex
CREATE INDEX "ApprovedEmail_isActive_role_idx" ON "ApprovedEmail"("isActive", "role");
