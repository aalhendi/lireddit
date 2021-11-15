/*
  Warnings:

  - You are about to drop the column `points` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "points";

-- CreateTable
CREATE TABLE "Votes" (
    "id" SERIAL NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "Votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsersOnPosts" (
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "value" BOOLEAN NOT NULL,

    CONSTRAINT "UsersOnPosts_pkey" PRIMARY KEY ("postId","userId")
);

-- AddForeignKey
ALTER TABLE "UsersOnPosts" ADD CONSTRAINT "UsersOnPosts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnPosts" ADD CONSTRAINT "UsersOnPosts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
