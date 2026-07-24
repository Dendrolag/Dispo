-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "finalSlotId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Poll_finalSlotId_key" ON "Poll"("finalSlotId");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_finalSlotId_fkey" FOREIGN KEY ("finalSlotId") REFERENCES "TimeSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

