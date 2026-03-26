-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT NOT NULL DEFAULT '',
    "readingTime" INTEGER,
    "description" TEXT,
    "filePath" TEXT NOT NULL
);
