
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import KanbanBoard from "@/components/ui/KanbanBoard";
import Header from "@/components/layout/Header";
// import UpcomingReminders from "@/components/dashboard/UpcomingReminders";
import { Card, CardContent } from "@/components/ui/card";
import { useJobs } from "@/contexts/JobsContext";
import { format } from "date-fns";
import JobStatusBadge from "@/components/jobs/JobStatusBadge";
import { Link } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { jobs, isLoading } = useJobs();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  // Calculate stats
  const totalApplications = jobs.length;
  const activeInterviews = jobs.filter(job => job.status === "interview").length;
  const offersReceived = jobs.filter(job => job.status === "offer").length;
  
  // Get 5 most recent applications
  const recentApplications = [...jobs]
    .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
    .slice(0, 5);

  return (
    <MainLayout>
      <Header 
        title="Dashboard" 
        subtitle="Track your job search progress" 
        // showAddButton
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardContent className="p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Applications</h3>
            <p className="text-4xl font-bold mt-2">{totalApplications}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardContent className="p-6">
            <h3 className="text-gray-500 text-sm font-medium">Active Interviews</h3>
            <p className="text-4xl font-bold mt-2 text-purple-600">{activeInterviews}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardContent className="p-6">
            <h3 className="text-gray-500 text-sm font-medium">Offers Received</h3>
            <p className="text-4xl font-bold mt-2 text-purple-600">{offersReceived}</p>
          </CardContent>
        </Card>
      </div>



     

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Applications */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardContent className="p-6">
            <h2 className="font-semibold text-xl mb-2">Recent Applications</h2>
            <p className="text-gray-500 text-sm mb-4">Your 5 most recent job applications</p>
            
            <div className="divide-y">
              {recentApplications.length > 0 ? (
                recentApplications.map((job) => (
                  <div key={job.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{job.jobTitle}</h3>
                        <p className="text-gray-500 text-sm">{job.companyName}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          Applied: {format(new Date(job.dateApplied), "MM/dd/yyyy")}
                        </p>
                      </div>
                      <JobStatusBadge status={job.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 py-4 text-center">No applications yet</p>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <Link to="/applications" className="text-purple-600 text-sm font-medium hover:underline">
                View All Applications
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Task Management */}
        {/* <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardContent className="p-6">
            <h2 className="font-semibold text-xl mb-4">Task Management</h2>
            <KanbanBoard />
          </CardContent>
        </Card> */}

        {/*  Upcoming Reminders */}
         {/* <UpcomingReminders jobs={jobs} /> */}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
