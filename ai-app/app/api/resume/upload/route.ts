import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(){
    try {
        const jobDetails = await prisma.jobDescription.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        return NextResponse.json({
      success: true,
      count: jobDetails.length,
      data: jobDetails,
    }, { status: 200 });
    } catch (error) {
    return NextResponse.json({
      success: false,
      message: "ABCkhjasbfkjhasbfhk",
      error: (error instanceof Error) ? error.message : String(error) 
    }, { status: 500 });
  }
}
