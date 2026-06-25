-- Bài bị từ chối theo quy tắc mới sẽ bị xóa vĩnh viễn.
DELETE FROM "Post"
WHERE "status" = 'REJECTED';

-- Giữ lại dữ liệu của các bài đã giải quyết trước đây dưới dạng bài đang hoạt động.
UPDATE "Post"
SET "status" = 'ACTIVE'
WHERE "status" = 'RESOLVED';

ALTER TABLE "Post" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "PostStatus" RENAME TO "PostStatus_old";

CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'ACTIVE', 'DELETED');

ALTER TABLE "Post"
ALTER COLUMN "status" TYPE "PostStatus"
USING ("status"::text::"PostStatus");

ALTER TABLE "Post" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "PostStatus_old";
