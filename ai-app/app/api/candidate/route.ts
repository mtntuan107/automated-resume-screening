"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface FitScoreEntry {
  jobId: string;
  jobTitle: string;
  score: number;
}

export interface CandidateFormData {
  fullName: string;
  email: string;
  phone: string;
  skills: string; 
  fitScore: number; 
}

export async function getCandidates(page = 1, pageSize = 10, search = "", minScore = 0) {
  try {
    const skip = (page - 1) * pageSize;
    const whereCondition: Prisma.CandidateWhereInput = {
      AND: [
        search ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        } : {}
      ]
    };

    const [candidates, totalCount] = await prisma.$transaction([
      prisma.candidate.findMany({
        where: whereCondition, 
        orderBy: { createdAt: "desc" },
        include: {
          cvUploads: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      }),
      prisma.candidate.count({ where: whereCondition }),
    ]);

    const filteredCandidates = candidates.filter(c => {
        if (minScore === 0) return true;
        const scores = (c.fitScores as unknown as FitScoreEntry[]) || [];
        return scores.some(s => s.score >= minScore);
    });

    const paginatedData = filteredCandidates.slice(skip, skip + pageSize);
    const finalTotal = filteredCandidates.length;
    const totalPages = Math.ceil(finalTotal / pageSize);

    return { 
      success: true, 
      data: paginatedData, 
      metadata: { currentPage: page, totalPages: totalPages > 0 ? totalPages : 1, totalCount: finalTotal, pageSize }
    };
  } catch (error) {
    return { success: false, data: [], metadata: { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: 10 } };
  }
}

export async function deleteCandidateContext(candidateId: string, jobId: string | null) {
    try {
        if (jobId) {
            const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
            if (!candidate) return { success: false, message: "Not found" };

            const currentScores = (candidate.fitScores as unknown as FitScoreEntry[]) || [];
            const newScores = currentScores.filter(s => s.jobId !== jobId);

            await prisma.cvUpload.deleteMany({ where: { candidateId, jobId } });

            if (newScores.length === 0) {
                await prisma.candidate.delete({ where: { id: candidateId } });
                revalidatePath("/candidates");
                return { success: true, message: "Deleted permanently (No jobs left)." };
            } else {
                await prisma.candidate.update({
                    where: { id: candidateId },
                    data: { fitScores: newScores as unknown as Prisma.InputJsonArray }
                });
                revalidatePath("/candidates");
                return { success: true, message: "Removed job context." };
            }
        } else {
            await prisma.candidate.delete({ where: { id: candidateId } });
            revalidatePath("/candidates");
            return { success: true, message: "Deleted permanently." };
        }
    } catch (error) {
        return { success: false, message: "Error deleting." };
    }
}

export async function getCandidatesForExport(search = "", minScore = 0) {
    try {
        const candidates = await prisma.candidate.findMany({
            where: {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            },
            orderBy: { createdAt: "desc" },
        });
        const finalData = candidates.filter(c => {
            const scores = (c.fitScores as unknown as FitScoreEntry[]) || [];
            return minScore === 0 || scores.some(s => s.score >= minScore);
        });
        return { success: true, data: finalData };
    } catch (error) { return { success: false, data: [] }; }
}

export async function createCandidate(data: CandidateFormData) {
    try {
        await prisma.candidate.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                skills: data.skills.split(","),
                fitScores: [] 
            }
        });
        revalidatePath("/candidates");
        return { success: true, message: "Created" };
    } catch(e) { return { success: false, message: "Error" }; }
}

export async function updateCandidate(id: string, data: CandidateFormData) {
    try {
        await prisma.candidate.update({
            where: { id },
            data: {
                fullName: data.fullName,
                email: data.email,
                skills: data.skills.split(","),
            }
        });
        revalidatePath("/candidates");
        return { success: true, message: "Updated" };
    } catch(e) { return { success: false, message: "Error" }; }
}