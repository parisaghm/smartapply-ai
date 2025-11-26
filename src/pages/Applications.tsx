
import React, { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Header from "@/components/layout/Header";
import { JobTable } from "@/components/jobs/JobTable";
import FilterBar from "@/components/jobs/FilterBar";
import { useJobs } from "@/contexts/JobsContext";
import { JobFilter } from "@/types";

const Applications: React.FC = () => {
  const { jobs, isLoading } = useJobs();
  const [filter, setFilter] = useState<JobFilter>({
    sortBy: "dateApplied",
    sortDirection: "desc",
  });

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    const jobsArray = jobs || [];
    let filtered = [...jobsArray];

    // Filter by status
    if (filter.status) {
      filtered = filtered.filter((job) => job.status === filter.status);
    }

    // Filter by search term
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.companyName.toLowerCase().includes(searchLower) ||
          job.jobTitle.toLowerCase().includes(searchLower) ||
          job.location?.toLowerCase().includes(searchLower) ||
          job.contactPerson?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (filter.sortBy) {
      filtered.sort((a, b) => {
        let aValue: string | Date = "";
        let bValue: string | Date = "";

        if (filter.sortBy === "dateApplied") {
          aValue = new Date(a.dateApplied);
          bValue = new Date(b.dateApplied);
        } else if (filter.sortBy === "lastUpdated") {
          aValue = new Date(a.lastUpdated);
          bValue = new Date(b.lastUpdated);
        } else if (filter.sortBy === "companyName") {
          aValue = a.companyName.toLowerCase();
          bValue = b.companyName.toLowerCase();
        }

        if (aValue < bValue) return filter.sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return filter.sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [jobs, filter]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header 
        title="Job Applications" 
        subtitle={`Managing ${jobs.length} applications`} 
      />
      
      <FilterBar 
        filter={filter}
        onFilterChange={setFilter}
      />
      
      <JobTable jobs={filteredJobs} />
    </MainLayout>
  );
};

export default Applications;
