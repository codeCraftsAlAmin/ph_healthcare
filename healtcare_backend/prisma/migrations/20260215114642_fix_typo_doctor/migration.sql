/*
  Warnings:

  - You are about to drop the column `avarageRating` on the `Doctor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "avarageRating",
ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
