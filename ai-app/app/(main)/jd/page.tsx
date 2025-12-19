"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { 
  getJobs, 
  createJob, 
  updateJob, 
  deleteJob, 
  JobFormData 
} from "@/app/api/jd/route";

import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Plus, 
  Loader2,
  Briefcase
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  createdAt: Date;
}

export default function JobDescriptionManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<JobFormData>();

  const fetchJobs = async () => {
    const res = await getJobs();
    if (res.success && res.data) {
      setJobs(res.data);
    } else {
      toast.error("Failed to load jobs");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenCreate = () => {
    setEditingJob(null);
    reset({ title: "", description: "", requirements: "" });
    setIsOpen(true);
  };

  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setValue("title", job.title);
    setValue("description", job.description);
    setValue("requirements", job.requirements || "");
    setIsOpen(true);
  };

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);
    try {
      if (editingJob) {
        const res = await updateJob(editingJob.id, data);
        if (res.success) {
          toast.success(res.message);
          fetchJobs();
          setIsOpen(false);
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await createJob(data);
        if (res.success) {
          toast.success(res.message);
          fetchJobs();
          setIsOpen(false);
        } else {
          toast.error(res.message);
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const promise = async () => {
      const res = await deleteJob(id);
      if (!res.success) throw new Error(res.message);
      fetchJobs();
      return res.message;
    };

    toast.promise(promise(), {
      loading: 'Deleting job...',
      success: (msg) => `${msg}`,
      error: 'Failed to delete job',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Job Descriptions
          </CardTitle>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add New Job
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Title</TableHead>
                <TableHead>Description / Requirements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-32 text-gray-500">
                    No job descriptions found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <div className="font-semibold text-base">{job.title}</div>
                    <div className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
                      Created: {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  
                  {/* ✅ 4. Xóa cell Department, gộp hiển thị mô tả */}
                  <TableCell className="text-sm text-gray-600 max-w-md">
                     <div className="line-clamp-2 font-medium text-gray-900 mb-1">
                        {job.description}
                     </div>
                     <div className="line-clamp-1 text-xs text-gray-500">
                        {job.requirements ? `Reqs: ${job.requirements}` : "No requirements"}
                     </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenEdit(job)} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(job.id)} 
                          className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job Description" : "Create New Job Position"}</DialogTitle>
            <DialogDescription>
              {editingJob ? "Update the job details below." : "Fill in the form to add a new position to the database."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Job Title <span className="text-red-500">*</span></Label>
              <Input {...register("title", { required: true })} placeholder="e.g. Senior Backend Engineer" />
            </div>
            
            <div className="space-y-2">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea 
                {...register("description", { required: true })} 
                placeholder="Describe the role responsibilities..." 
                className="h-32" 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Requirements & Skills</Label>
              <Textarea 
                {...register("requirements")} 
                placeholder="- 3+ years of Node.js&#10;- Experience with Next.js..." 
                className="h-32" 
              />
              <p className="text-xs text-gray-500">
                Tip: This content is important for AI to match candidates accurately.
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingJob ? "Save Changes" : "Create Job"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}