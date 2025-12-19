import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { extractTextFromPDF } from "@/lib/utils/file-parser";
import { parseAndScoreCV } from "@/lib/ai/gemini";
import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises"; 
import path from "path";

interface FitScoreEntry {
  jobId: string;
  jobTitle: string;
  score: number;
}

export const runtime = 'nodejs'; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobId = formData.get("job_id") as string;
    const files = formData.getAll("files") as File[];

    if (!files.length || !jobId) {
      return NextResponse.json({ error: "Missing files or job_id" }, { status: 400 });
    }

    // 1. Lấy thông tin Job
    const job = await prisma.jobDescription.findUnique({
      where: { id: jobId },
      select: { title: true, requirements: true, description: true }
    });

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const jobContext = job.requirements || job.description || "";
    const jobTitle = job.title;

    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true }).catch(console.error);

    const processedCandidates = [];
    const duplicateCandidates = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");

      // 2. CHECK HASH: Nếu file y hệt đã nộp vào Job này -> Báo trùng (Skip AI)
      const existingExactUpload = await prisma.cvUpload.findFirst({
        where: { hash: hash, jobId: jobId },
        include: { candidate: true }
      });

      if (existingExactUpload) {
          const cand = existingExactUpload.candidate;
          const scores = (cand.fitScores as unknown as FitScoreEntry[]) || [];
          const currentScore = scores.find(s => s.jobId === jobId)?.score || 0;

          duplicateCandidates.push({
              fileName: file.name,
              candidateName: cand.fullName,
              email: cand.email,
              existingId: cand.id,
              fileUrl: existingExactUpload.fileUrl,
              hash: hash,
              newParsedData: {
                  fullName: cand.fullName,
                  email: cand.email,
                  skills: cand.skills,
                  fitScore: currentScore,
                  phone: null
              }
          });
          continue; 
      }

      // 3. Nếu chưa trùng Hash -> Lưu file & Chạy AI
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      await writeFile(path.join(uploadDir, fileName), buffer);
      
      const rawText = await extractTextFromPDF(buffer);
      const aiResult = await parseAndScoreCV(rawText, jobContext);
      if (!aiResult) continue;

      const { email, full_name, skills } = aiResult.candidate_info;
      const { fit_score } = aiResult.evaluation;
      const fileUrl = `/uploads/${fileName}`;

      // 4. CHECK EMAIL (Xử lý Merge / Duplicate Job)
      const candidate = await prisma.candidate.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
      });

      if (candidate) {
        // Clone mảng JSON ra để thao tác an toàn
        let currentScores: FitScoreEntry[] = [];
        if (Array.isArray(candidate.fitScores)) {
            currentScores = JSON.parse(JSON.stringify(candidate.fitScores));
        }
        
        const existingJobIndex = currentScores.findIndex(s => s.jobId === jobId);

        if (existingJobIndex > -1) {
             // A. TRÙNG JOB -> Đẩy vào danh sách chờ xử lý
             duplicateCandidates.push({
                 fileName: file.name,
                 candidateName: candidate.fullName,
                 email: candidate.email,
                 existingId: candidate.id,
                 fileUrl,
                 hash,
                 newParsedData: {
                     fullName: full_name,
                     email: email,
                     skills: skills,
                     fitScore: fit_score,
                     phone: null
                 }
             });
        } else {
             // B. KHÁC JOB -> Tự động Merge
             currentScores.push({ jobId, jobTitle, score: fit_score });
             const updatedSkills = Array.from(new Set([...candidate.skills, ...skills]));

             const updatedCandidate = await prisma.candidate.update({
                 where: { id: candidate.id },
                 data: { 
                     fitScores: currentScores as unknown as Prisma.InputJsonArray,
                     skills: updatedSkills 
                 }
             });
             
             await prisma.cvUpload.create({
                 data: { fileUrl, hash, jobId, candidateId: candidate.id, status: "PROCESSED" }
             });

             processedCandidates.push({
                 id: updatedCandidate.id,
                 fullName: updatedCandidate.fullName,
                 email: updatedCandidate.email,
                 fitScore: fit_score,
                 skills: updatedCandidate.skills
             });
        }

      } else {
        // C. NGƯỜI MỚI HOÀN TOÀN
        const initialScores: FitScoreEntry[] = [{ jobId, jobTitle, score: fit_score }];
        const newCand = await prisma.candidate.create({
            data: {
                fullName: full_name || "Unknown",
                email: email,
                skills: skills,
                fitScores: initialScores as unknown as Prisma.InputJsonArray,
                cvUploads: { create: { fileUrl, hash, jobId, status: "PROCESSED" } }
            }
        });

        processedCandidates.push({
            id: newCand.id,
            fullName: newCand.fullName,
            email: newCand.email,
            fitScore: fit_score,
            skills: newCand.skills
        });
      }
    }

    return NextResponse.json({ success: true, data: { new: processedCandidates, duplicates: duplicateCandidates } });

  } catch (error) {
    console.error("Upload API Error:", error); 
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}