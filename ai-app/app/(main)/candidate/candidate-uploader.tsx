"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UploadCloud, CheckCircle2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner"; 
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import DuplicateResolverModal, { DuplicateRecord } from "./duplicate-resolver-modal";

interface Job { id: string; title: string; }
interface ProcessedCandidate {
  id: string; fullName: string | null; email: string | null; fitScore: number | null; skills: string[];
}
interface UploadResult {
  new: ProcessedCandidate[]; duplicates: DuplicateRecord[];
}

export default function CandidateUploader({ jobs = [] }: { jobs: Job[] }) {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  
  const [processingResult, setProcessingResult] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  useEffect(() => {
    if (result && result.duplicates && result.duplicates.length > 0) {
      setIsDuplicateModalOpen(true);
    }
  }, [result]);

  const handleUpload = async () => {
    if (!files || !selectedJobId) return toast.error("Chọn Job và File CV!");
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("job_id", selectedJobId);
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/cv/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.success) setResult(data.data);
      else throw new Error(data.error);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Đã có lỗi không xác định xảy ra";
        toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleProcessDuplicate = async (action: string, duplicateItem: DuplicateRecord) => {
    const payload = {
        action: action, 
        targetId: duplicateItem.existingId, 
        jobId: selectedJobId, 
        newData: duplicateItem.newParsedData, 
        fileUrl: duplicateItem.fileUrl,
        fileHash: duplicateItem.hash
    };

    const toastId = toast.loading(`Đang thực hiện ${action}...`);

    try {
        const res = await fetch("/api/cv/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to process");
        }

        const response = await res.json();

        setTimeout(() => {
            setResult((prev) => {
                if (!prev) return null;
                
                const remainingDuplicates = prev.duplicates.filter(
                    (d) => d.fileName !== duplicateItem.fileName
                );

                const processedCandidate = response.data ? {
                    id: response.data.id,
                    fullName: response.data.fullName,
                    email: response.data.email,
                    fitScore: duplicateItem.newParsedData.fitScore,
                    skills: response.data.skills
                } : null;

                const newCandidates = processedCandidate 
                    ? [processedCandidate, ...prev.new] 
                    : prev.new;

                if (remainingDuplicates.length === 0) {
                    setIsDuplicateModalOpen(false);
                }

                return {
                    new: newCandidates,
                    duplicates: remainingDuplicates
                };
            });

            toast.dismiss(toastId);

            setProcessingResult({
                isOpen: true,
                type: "success",
                title: "Thành công",
                message: `Thao tác ${action} đã hoàn tất.`
            });
            
        }, 100);

    } catch (error) {
        toast.dismiss(toastId);
        const msg = (error as Error).message || "Lỗi xử lý";
        
        setProcessingResult({
            isOpen: true,
            type: "error",
            title: "Lỗi",
            message: msg
        });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Upload CV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select onValueChange={setSelectedJobId}>
                <SelectTrigger><SelectValue placeholder="Select Job" /></SelectTrigger>
                <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="file" multiple accept=".pdf" onChange={(e) => setFiles(e.target.files)} />
          </div>
          <Button onClick={handleUpload} disabled={uploading || !files || !selectedJobId} className="mt-4">
            {uploading ? <Loader2 className="animate-spin mr-2"/> : <UploadCloud className="mr-2"/>} Start AI
          </Button>
        </CardContent>
      </Card>

      {result && result.new.length > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader><CardTitle className="text-green-700 flex gap-2"><CheckCircle2/> Processed ({result.new.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {result.new.map((c, i) => (
              <div key={i} className="bg-white p-3 rounded border shadow-sm flex justify-between">
                 <div>
                    <div className="font-bold">{c.fullName}</div>
                    <div className="text-sm text-gray-500">{c.email}</div>
                 </div>
                 <Badge className={c.fitScore! >= 80 ? "bg-green-500" : "bg-yellow-500"}>{c.fitScore}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result && (
        <DuplicateResolverModal 
          isOpen={isDuplicateModalOpen}
          onOpenChange={setIsDuplicateModalOpen}
          duplicates={result.duplicates}
          onProcess={handleProcessDuplicate}
        />
      )}

      <AlertDialog 
        open={processingResult.isOpen} 
        onOpenChange={(open) => setProcessingResult(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${processingResult.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {processingResult.type === 'success' ? <CheckCircle className="h-6 w-6"/> : <XCircle className="h-6 w-6"/>}
              {processingResult.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-base mt-2">
              {processingResult.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setProcessingResult(prev => ({ ...prev, isOpen: false }))}
              className={processingResult.type === 'success' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}