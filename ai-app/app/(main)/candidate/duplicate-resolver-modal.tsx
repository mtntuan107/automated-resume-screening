"use client";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge"; 
import { 
  MoreHorizontal, GitMerge, RefreshCw, UserPlus, AlertTriangle 
} from "lucide-react";

interface ParsedData {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  fitScore: number | null;
  
}

export interface DuplicateRecord {
  fileName: string;
  candidateName: string | null;
  email: string | null;
  existingId?: string | null; 
  fileUrl: string;
  newParsedData: ParsedData;
  hash: string;
}

interface DuplicateResolverModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateRecord[];
  onProcess: (action: string, item: DuplicateRecord) => void;
}

export default function DuplicateResolverModal({
  isOpen,
  onOpenChange,
  duplicates,
  onProcess,
}: DuplicateResolverModalProps) {
  
  if (!duplicates || duplicates.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-yellow-700 gap-2">
            <AlertTriangle className="h-5 w-5" />
            Detect duplicates within the same job ({duplicates.length})
          </DialogTitle>
          <DialogDescription>
            These candidates have already applied for this position. How would you like to proceed?
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-3">
          {duplicates.map((d, idx) => (
            <div key={idx} className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-200 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3 flex-1">
                {/* Score Badge */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                   <Badge className={`${(d.newParsedData.fitScore || 0) >= 80 ? 'bg-green-600' : 'bg-yellow-600'}`}>
                      {d.newParsedData.fitScore || 0}%
                   </Badge>
                   <span className="text-[10px] text-gray-500 font-medium">MATCH</span>
                </div>

                <div>
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    {d.candidateName || d.newParsedData.fullName || "Unknown Name"}
                  </div>
                  <div className="text-sm text-gray-600">
                    File: <span className="font-medium">{d.fileName}</span>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-1">
                    Email: {d.email || d.newParsedData.email || "N/A"}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-yellow-300 bg-white hover:bg-yellow-100 text-yellow-700">
                    Actions <MoreHorizontal className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Action</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onProcess("MERGE", d)} className="cursor-pointer text-green-600">
                    <GitMerge className="mr-2 h-4 w-4" /> Merge
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onProcess("REPLACE", d)} className="cursor-pointer text-orange-600">
                    <RefreshCw className="mr-2 h-4 w-4" /> Replace
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onProcess("CREATE_NEW", d)} className="cursor-pointer text-green-600">
                    <UserPlus className="mr-2 h-4 w-4" /> Create New
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}