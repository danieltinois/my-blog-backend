-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT NOT NULL DEFAULT '',
    "readingTime" INTEGER,
    "description" TEXT,
    "filePath" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Post" ("description", "filePath", "id", "publishedAt", "readingTime", "tags", "title") SELECT "description", "filePath", "id", "publishedAt", "readingTime", "tags", "title" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
