-- Các bài đã soft-delete trước đây không còn được giữ trong cơ sở dữ liệu.
DELETE FROM "Post"
WHERE "status" = 'DELETED';

ALTER TABLE "Post" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "PostStatus" RENAME TO "PostStatus_old";

CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'ACTIVE');

ALTER TABLE "Post"
ALTER COLUMN "status" TYPE "PostStatus"
USING ("status"::text::"PostStatus");

ALTER TABLE "Post" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "PostStatus_old";
