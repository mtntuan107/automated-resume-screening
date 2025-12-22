import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function parseAndScoreCV(cvText: string, jobDescription: string) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    Bạn là chuyên gia tuyển dụng AI. Nhiệm vụ:
    1. Trích xuất thông tin từ CV ứng viên.
    2. So sánh với JD để chấm điểm độ phù hợp (0-100).
    
    JD: ${jobDescription}
    CV Content: ${cvText}

    Output JSON format strictly:
    {
      "candidate_info": {
        "full_name": "string",
        "email": "string",
        "dob": "string",
        "gender": "string",
        "address": "string",
        "skills": ["string"]
      },
      "evaluation": {
        "fit_score": number,
        "strengths": ["string"],
        "weaknesses": ["string"],
        "summary": "string"
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
}