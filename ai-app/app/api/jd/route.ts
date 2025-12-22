"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface JobFormData {
  title: string;
  description: string;
  requirements: string;
}

export async function getJobs() {
  try {
    const jobs = await prisma.jobDescription.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: jobs };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function createJob(data: JobFormData) {
  try {
    await prisma.jobDescription.create({
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements || "",
      },
    });
    revalidatePath("/jd"); 
    return { success: true, message: "Created successfully" };
  } catch (error) {
    return { success: false, message: "Failed to create job" };
  }
}

export async function updateJob(id: string, data: JobFormData) {
  try {
    await prisma.jobDescription.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements || "",
      },
    });
    revalidatePath("/jd");
    return { success: true, message: "Updated successfully" };
  } catch (error) {
    return { success: false, message: "Failed to update job" };
  }
}

export async function deleteJob(id: string) {
  try {
    await prisma.jobDescription.delete({
      where: { id },
    });
    revalidatePath("/jd");
    return { success: true, message: "Deleted successfully" };
  } catch (error) {
    return { success: false, message: "Failed to delete job" };
  }
}