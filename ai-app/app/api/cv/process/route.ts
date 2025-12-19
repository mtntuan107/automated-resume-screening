import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface FitScoreEntry {
  jobId: string;
  jobTitle: string;
  score: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, targetId, newData, jobId, fileUrl, fileHash } = body;

    if (!action || !newData || !jobId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const job = await prisma.jobDescription.findUnique({
      where: { id: jobId },
      select: { title: true }
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const jobTitle = job.title;

    let resultCandidate;

    switch (action) {
      case "MERGE": {
        const existingCandidate = await prisma.candidate.findUnique({ where: { id: targetId } });
        if (!existingCandidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Logic Skill
        const mergedSkills = Array.from(new Set([...existingCandidate.skills, ...newData.skills]));

        // Logic JSON Score
        let currentScores: FitScoreEntry[] = [];
        if (Array.isArray(existingCandidate.fitScores)) {
            currentScores = JSON.parse(JSON.stringify(existingCandidate.fitScores));
        }
        const idx = currentScores.findIndex(s => s.jobId === jobId);
        if (idx > -1) currentScores[idx].score = newData.fitScore;
        else currentScores.push({ jobId, jobTitle, score: newData.fitScore });

        resultCandidate = await prisma.candidate.update({
          where: { id: targetId },
          data: {
            fullName: newData.fullName || existingCandidate.fullName,
            email: newData.email || existingCandidate.email,
            skills: mergedSkills,
            fitScores: currentScores as unknown as Prisma.InputJsonArray,
            cvUploads: { create: { fileUrl, hash: fileHash, jobId, status: "PROCESSED" } }
          }
        });
        break;
      }

      case "REPLACE": {
        const existingCandidate = await prisma.candidate.findUnique({ where: { id: targetId } });
        if (!existingCandidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

        let currentScores: FitScoreEntry[] = [];
        if (Array.isArray(existingCandidate.fitScores)) {
            currentScores = JSON.parse(JSON.stringify(existingCandidate.fitScores));
        }
        const idx = currentScores.findIndex(s => s.jobId === jobId);
        if (idx > -1) currentScores[idx].score = newData.fitScore;
        else currentScores.push({ jobId, jobTitle, score: newData.fitScore });

        resultCandidate = await prisma.candidate.update({
          where: { id: targetId },
          data: {
            fullName: newData.fullName,
            email: newData.email,
            skills: newData.skills, // Ghi đè skill
            fitScores: currentScores as unknown as Prisma.InputJsonArray,
            cvUploads: { create: { fileUrl, hash: fileHash, jobId, status: "PROCESSED" } }
          }
        });
        break;
      }

      case "CREATE_NEW": {
        const initialScores: FitScoreEntry[] = [{ jobId, jobTitle, score: newData.fitScore }];
        resultCandidate = await prisma.candidate.create({
          data: {
            fullName: newData.fullName,
            email: newData.email, // Lưu ý: Schema phải bỏ @unique ở email nếu muốn tạo trùng
            skills: newData.skills,
            fitScores: initialScores as unknown as Prisma.InputJsonArray,
            cvUploads: { create: { fileUrl, hash: fileHash, jobId, status: "PROCESSED" } }
          }
        });
        break;
      }
    }

    return NextResponse.json({ success: true, data: resultCandidate });

  } catch (error) {
    console.error("Process API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}