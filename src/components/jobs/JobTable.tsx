import React, { useState } from "react";
import { JobApplication } from "@/types";
import JobStatusBadge from "./JobStatusBadge";
import { EditJobDialog } from "./EditJobDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useJobs } from "@/contexts/JobsContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface JobTableProps {
  jobs: JobApplication[];
}

export const JobTable: React.FC<JobTableProps> = ({ jobs }) => {
  const { deleteJob } = useJobs();
  const { toast } = useToast();
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);

  const handleDelete = (id: string, companyName: string) => {
    deleteJob(id);
    toast({
      title: "Application deleted",
      description: `Removed ${companyName} from your applications.`,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMM");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="rounded-md border bg-card mt-6">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Company</TableHead>
            <TableHead className="font-semibold">Job Title</TableHead>
            <TableHead className="font-semibold">Link</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="font-semibold">Last Update</TableHead>
            <TableHead className="font-semibold">Contact Person</TableHead>
            <TableHead className="font-semibold">Interview Step</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Reason/Outcome</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No job applications found
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.companyName}</TableCell>
                <TableCell>{job.jobTitle}</TableCell>
                <TableCell>
                  {job.jobLink ? (
                    <a
                      href={job.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Doc link
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{job.location || "-"}</TableCell>
                <TableCell>{formatDate(job.lastUpdated)}</TableCell>
                <TableCell>{job.contactPerson || "-"}</TableCell>
                <TableCell>{job.interviewStep || "-"}</TableCell>
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {job.reasonOutcome || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => setEditingJob(job)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the application for {job.companyName}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(job.id, job.companyName)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {editingJob && (
        <EditJobDialog
          job={editingJob}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
        />
      )}
    </div>
  );
};
