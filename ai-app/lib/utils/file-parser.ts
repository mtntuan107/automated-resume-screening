// lib/utils/file-parser.ts
import PDFParser from "pdf2json";

// 1. FIX TYPE: Định nghĩa đúng kiểu dữ liệu mà thư viện trả về
// Nó có thể là object chứa parserError HOẶC chính là Error
type PDFParserError = { parserError: Error } | Error;

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve) => {
    const parser = new PDFParser(null, true);

    // 2. FIX LOGIC: Xử lý type union
    parser.on("pdfParser_dataError", (errData: PDFParserError) => {
      // Kiểm tra xem lỗi nằm ở đâu để lấy message cho đúng
      const errorObj = 'parserError' in errData ? errData.parserError : errData;
      
      console.error("PDF2JSON Error:", errorObj.message);
      resolve(""); 
    });

    parser.on("pdfParser_dataReady", () => {
      try {
        const rawText = parser.getRawTextContent();
        resolve(rawText);
      } catch (e) {
        console.error("Error extracting text content:", e);
        resolve("");
      }
    });

    parser.parseBuffer(buffer);
  });
}