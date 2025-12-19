// app/(main)/candidate/page.tsx
import prisma from "@/lib/prisma";
import CandidateUploader from "./candidate-uploader"
import { Separator } from "@/components/ui/separator";
import CandidateTableComponent from "./candidate-table";
// Dòng này bắt buộc để Next.js không cache kết quả query DB, luôn lấy data mới nhất
export const dynamic = "force-dynamic";

export default async function CandidatePage() {
  // 1. Lấy danh sách Job để user chọn khi upload
  const jobs = await prisma.jobDescription.findMany({
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="p-2 max-w-7xl mx-auto">
      <CandidateTableComponent />

      <Separator className="my-6" />

      <CandidateUploader jobs={jobs} />
    </div>
  );
}