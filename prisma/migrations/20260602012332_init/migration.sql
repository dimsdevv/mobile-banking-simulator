-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "accountNumber" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 12500000,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'id',
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL DEFAULT 0,
    "totalAmount" BIGINT NOT NULL,
    "description" TEXT,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "category" TEXT NOT NULL DEFAULT 'transfer',
    "senderId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderAccount" TEXT NOT NULL,
    "senderBank" TEXT NOT NULL DEFAULT 'SimBank',
    "recipientId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientAccount" TEXT NOT NULL,
    "recipientBank" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_recipients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "saved_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_accountNumber_key" ON "users"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_senderId_createdAt_idx" ON "transactions"("senderId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "transactions_recipientId_createdAt_idx" ON "transactions"("recipientId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "saved_recipients_userId_accountNumber_key" ON "saved_recipients"("userId", "accountNumber");
