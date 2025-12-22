"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as XLSX from "xlsx"; 

import {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidateContext,
  getCandidatesForExport, 
  CandidateFormData,
} from "@/app/api/candidate/route"; 

import {
  MoreHorizontal, Pencil, Trash2, Plus, Loader2, Users, FileText,
  ChevronLeft, ChevronRight, Search, Filter, Download, Briefcase, X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FitScoreEntry {
  jobId: string;
  jobTitle: string;
  score: number;
}

interface Candidate {
  id: string;
  fullName: string | null;
  email: string | null;
  skills: string[];
  fitScores: FitScoreEntry[];
  createdAt: Date;
  cvUploads?: { fileUrl: string }[];
}

interface CandidateExportItem {
  fullName: string | null;
  email: string | null;
  skills: string[];
  createdAt: Date | string;
  fitScores: unknown;
}

export default function CandidateTableComponent() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterScore, setFilterScore] = useState("0");

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<CandidateFormData>();

  const fetchCandidates = useCallback(async (page: number, search: string, minScore: number) => {
    setIsLoading(true);
    const res = await getCandidates(page, 5, search, minScore);
    
    if (res.success && res.data) {
      setCandidates(res.data as unknown as Candidate[]);
      if (res.metadata) {
        setTotalPages(res.metadata.totalPages);
        setTotalCount(res.metadata.totalCount);
        setCurrentPage(res.metadata.currentPage);
      }
    } else {
      toast.error("Failed to load candidates");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCandidates(currentPage, searchTerm, Number(filterScore));
    }, 500); 
    return () => clearTimeout(timer);
  }, [searchTerm, filterScore, currentPage, fetchCandidates]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchCandidates(newPage, searchTerm, Number(filterScore));
    }
  };

  const handleDeleteContext = async (candidateId: string, jobId: string | null) => {
     const isContext = !!jobId;
     const confirmMsg = isContext 
        ? "Bạn có chắc muốn gỡ ứng viên khỏi Job này?" 
        : "Hành động này sẽ xóa vĩnh viễn ứng viên. Tiếp tục?";
     
     if(!confirm(confirmMsg)) return;

     const promise = async () => {
        const res = await deleteCandidateContext(candidateId, jobId);
        if(!res.success) throw new Error(res.message);
        fetchCandidates(currentPage, searchTerm, Number(filterScore));
        return res.message;
     };

     toast.promise(promise(), {
        loading: "Đang xử lý...",
        success: (msg) => `${msg}`,
        error: "Lỗi khi xóa"
     });
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await getCandidatesForExport(searchTerm, Number(filterScore));
      
      if (res.success && res.data.length > 0) {
        const excelData = res.data.map((c: CandidateExportItem) => {
          const scores = (c.fitScores as FitScoreEntry[]) || [];
          
          const jobSummary = scores.map(s => `${s.jobTitle} (${s.score}%)`).join(" | ");

          return {
            "Full Name": c.fullName,
            "Email": c.email,
            "Applied Jobs & Scores": jobSummary || "N/A",
            "Skills": c.skills.join(", "),
            "Created At": new Date(c.createdAt).toLocaleDateString(),
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        worksheet['!cols'] = [{wch: 25}, {wch: 30}, {wch: 50}, {wch: 30}, {wch: 15}];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
        XLSX.writeFile(workbook, `Candidates_Export.xlsx`);
        toast.success("Export successfully!");
      } else {
        toast.warning("No data.");
      }
    } catch (error) {
      toast.error("Export failure");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCandidate(null);
    reset({ fullName: "", email: "", phone: "", skills: "", fitScore: 0 });
    setIsOpen(true);
  };

  const handleOpenEdit = (c: Candidate) => {
    setEditingCandidate(c);
    setValue("fullName", c.fullName || "");
    setValue("email", c.email || "");
    setValue("skills", c.skills.join(", "));
    setIsOpen(true);
  };

  const onSubmit = async (data: CandidateFormData) => {
    setIsSubmitting(true);
    try {
      if (editingCandidate) {
        await updateCandidate(editingCandidate.id, data);
        toast.success("Đã cập nhật");
      } else {
        await createCandidate(data);
        toast.success("Đã tạo mới");
      }
      setIsOpen(false);
      fetchCandidates(currentPage, searchTerm, Number(filterScore));
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 5. RENDER UI ---
  return (
    <Card className="w-full shadow-sm border-slate-200">
      <CardHeader className="flex flex-col md:flex-row items-center justify-between pb-4 border-b">
         <div className="space-y-1">
             <CardTitle className="text-xl flex items-center gap-2">
                 <Users className="h-5 w-5"/> CANDIDATE ({totalCount})
             </CardTitle>
         </div>
         <div className="flex gap-2">
             <Button variant="outline" onClick={handleExportExcel} disabled={isExporting}>
                 {isExporting ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Download className="h-4 w-4 mr-2"/>}
                 Excel
             </Button>
             <Button onClick={handleOpenCreate}>
                 <Plus className="h-4 w-4 mr-2"/> Add
             </Button>
         </div>
      </CardHeader>
      
      {/* Filters */}
      <div className="p-4 flex gap-3 bg-gray-50/50">
         <div className="relative flex-1">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"/>
             <Input className="pl-9" placeholder="Find candidate by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
         </div>
         <Select value={filterScore} onValueChange={setFilterScore}>
             <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Score" /></SelectTrigger>
             <SelectContent>
                 <SelectItem value="0">Filter</SelectItem>
                 <SelectItem value="50">{'>'} 50%</SelectItem>
                 <SelectItem value="80">{'>'} 80%</SelectItem>
             </SelectContent>
         </Select>
      </div>

      <CardContent className="p-0">
         <Table>
             <TableHeader className="bg-gray-100">
                 <TableRow>
                     <TableHead className="w-[250px]">Name/Email</TableHead>
                     <TableHead>Job Context</TableHead>
                     <TableHead>Skills</TableHead>
                     <TableHead className="text-right">Action</TableHead>
                 </TableRow>
             </TableHeader>
             <TableBody>
                 {candidates.length === 0 && !isLoading && (
                     <TableRow><TableCell colSpan={4} className="text-center py-10 text-gray-500">No data</TableCell></TableRow>
                 )}
                 
                 {candidates.map((c) => {
                     // Parse JSON Fit Scores
                     const scores = (c.fitScores as unknown as FitScoreEntry[]) || [];
                     
                     return (
                         <TableRow key={c.id}>
                             <TableCell>
                                 <div className="font-semibold">{c.fullName}</div>
                                 <div className="text-xs text-gray-500">{c.email}</div>
                                 {c.cvUploads?.[0] && (
                                     <a href={c.cvUploads[0].fileUrl} target="_blank" className="text-blue-600 hover:underline text-[11px] flex items-center mt-1">
                                         <FileText className="h-3 w-3 mr-1"/> View CV
                                     </a>
                                 )}
                             </TableCell>

                             <TableCell>
                                 <div className="flex flex-wrap gap-2">
                                     {scores.map((s, idx) => (
                                         <div key={idx} className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded border text-xs ${s.score >= 80 ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                             <Briefcase className="h-3 w-3 text-slate-400"/>
                                             <span className="font-medium text-slate-700">{s.jobTitle}</span>
                                             <Badge variant={s.score >= 80 ? "default" : "secondary"} className={`h-5 px-1 text-[10px] ${s.score >= 80 ? "bg-green-600 hover:bg-green-700" : ""}`}>
                                                 {s.score}%
                                             </Badge>
                                             
                                             {/* Nút X nhỏ để xóa ngữ cảnh này */}
                                             <TooltipProvider>
                                                 <Tooltip>
                                                     <TooltipTrigger asChild>
                                                         <button 
                                                            onClick={() => handleDeleteContext(c.id, s.jobId)}
                                                            className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                                                         >
                                                             <X className="h-3 w-3"/>
                                                         </button>
                                                     </TooltipTrigger>
                                                     <TooltipContent>Remove tags</TooltipContent>
                                                 </Tooltip>
                                             </TooltipProvider>
                                         </div>
                                     ))}
                                     {scores.length === 0 && <span className="text-xs text-gray-400 italic"></span>}
                                 </div>
                             </TableCell>

                             <TableCell>
                                 <div className="flex flex-wrap gap-1">
                                     {c.skills.slice(0, 3).map((sk, i) => (
                                         <Badge key={i} variant="outline" className="text-[10px] text-gray-600 bg-gray-50">{sk}</Badge>
                                     ))}
                                     {c.skills.length > 3 && <span className="text-[10px] text-gray-400">+{c.skills.length - 3}</span>}
                                 </div>
                             </TableCell>

                             <TableCell className="text-right">
                                 <DropdownMenu>
                                     <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                     <DropdownMenuContent align="end">
                                         <DropdownMenuItem onClick={() => handleOpenEdit(c)}>
                                             <Pencil className="mr-2 h-4 w-4"/> Edit
                                         </DropdownMenuItem>
                                         <DropdownMenuSeparator />
                                         <DropdownMenuItem onClick={() => handleDeleteContext(c.id, null)} className="text-red-600 focus:text-red-600">
                                             <Trash2 className="mr-2 h-4 w-4"/> Delete
                                         </DropdownMenuItem>
                                     </DropdownMenuContent>
                                 </DropdownMenu>
                             </TableCell>
                         </TableRow>
                     );
                 })}
             </TableBody>
         </Table>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>{editingCandidate ? "Edit" : "Create"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                      <Label>Name</Label>
                      <Input {...register("fullName", {required: true})} />
                  </div>
                  <div className="space-y-2">
                      <Label>Email</Label>
                      <Input {...register("email", {required: true})} />
                  </div>
                  <div className="space-y-2">
                      <Label>Skills</Label>
                      <Textarea {...register("skills")} placeholder="React, Node.js..." />
                  </div>
                  <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </Card>
  );
}