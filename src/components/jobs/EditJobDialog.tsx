import React, { useState } from "react";
import { JobApplication, JobStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJobs } from "@/contexts/JobsContext";
import { useToast } from "@/hooks/use-toast";

interface EditJobDialogProps {
  job: JobApplication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditJobDialog: React.FC<EditJobDialogProps> = ({
  job,
  open,
  onOpenChange,
}) => {
  const { updateJob } = useJobs();
  const { toast } = useToast();
  const [formData, setFormData] = useState<JobApplication>(job);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateJob({
      ...formData,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    toast({
      title: "Application updated",
      description: `Updated ${formData.companyName} successfully.`,
    });
    onOpenChange(false);
  };

  const handleChange = (field: keyof JobApplication, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Application</DialogTitle>
          <DialogDescription>
            Update the details of your job application
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => handleChange("jobTitle", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="e.g., Finland"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson || ""}
                  onChange={(e) => handleChange("contactPerson", e.target.value)}
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value as JobStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interviewStep">Interview Step</Label>
                <Input
                  id="interviewStep"
                  value={formData.interviewStep || ""}
                  onChange={(e) => handleChange("interviewStep", e.target.value)}
                  placeholder="e.g., 1st, 2nd with CEO"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobLink">Job Link (URL)</Label>
              <Input
                id="jobLink"
                type="url"
                value={formData.jobLink || ""}
                onChange={(e) => handleChange("jobLink", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonOutcome">Reason/Outcome</Label>
              <Input
                id="reasonOutcome"
                value={formData.reasonOutcome || ""}
                onChange={(e) => handleChange("reasonOutcome", e.target.value)}
                placeholder="e.g., Other Candidates, Got an offer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateApplied">Date Applied</Label>
                <Input
                  id="dateApplied"
                  type="date"
                  value={formData.dateApplied}
                  onChange={(e) => handleChange("dateApplied", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate || ""}
                  onChange={(e) => handleChange("followUpDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
