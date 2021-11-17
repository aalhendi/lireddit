-- DropForeignKey
ALTER TABLE "UsersOnPosts" DROP CONSTRAINT "UsersOnPosts_postId_fkey";

-- AddForeignKey
ALTER TABLE "UsersOnPosts" ADD CONSTRAINT "UsersOnPosts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
