import React, { useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer } from "@/components/ui/chart";
import { useJobs } from "@/contexts/JobsContext";
import { startOfWeek, endOfWeek, format, differenceInDays, parseISO } from 'date-fns';

const config = {
  interested: { color: '#1e88e5' },
  applied: { color: '#00c9a7' },
  interview: { color: '#ffbb33' },
  rejected: { color: '#ff6b6b' },
  offer: { color: '#9c7df3' },
  applications: { color: '#8884d8' },
};

const Analytics = () => {
  const { jobs } = useJobs();

  // Calculate status breakdown
  const statusData = useMemo(() => {
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Interested', value: statusCounts['interested'] || 0, color: '#1e88e5' },
      { name: 'Applied', value: statusCounts['applied'] || 0, color: '#00c9a7' },
      { name: 'Interview', value: statusCounts['interview'] || 0, color: '#ffbb33' },
      { name: 'Rejected', value: statusCounts['rejected'] || 0, color: '#ff6b6b' },
      { name: 'Offer', value: statusCounts['offer'] || 0, color: '#9c7df3' },
    ].filter(item => item.value > 0);
  }, [jobs]);

  // Calculate weekly application data (last 5 weeks)
  const weeklyApplicationData = useMemo(() => {
    const weeks: { week: string; applications: number }[] = [];
    const now = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = endOfWeek(weekStart);
      
      const count = jobs.filter(job => {
        if (!job.dateApplied) return false;
        const appDate = parseISO(job.dateApplied);
        return appDate >= weekStart && appDate <= weekEnd;
      }).length;

      weeks.push({
        week: `${format(weekStart, 'MMM d')}-${format(weekEnd, 'd')}`,
        applications: count,
      });
    }
    
    return weeks;
  }, [jobs]);

  // Calculate offer rate
  const offerRate = useMemo(() => {
    const totalApplied = jobs.filter(job => job.status !== 'interested').length;
    const offers = jobs.filter(job => job.status === 'offer').length;
    return totalApplied > 0 ? Math.round((offers / totalApplied) * 100) : 0;
  }, [jobs]);

  // Calculate average days to interview (estimated based on time since application)
  const averageDaysToInterview = useMemo(() => {
    const interviewJobs = jobs.filter(job => 
      job.status === 'interview' && job.dateApplied
    );
    
    if (interviewJobs.length === 0) return 0;
    
    const totalDays = interviewJobs.reduce((sum, job) => {
      const applied = parseISO(job.dateApplied!);
      const now = new Date();
      return sum + differenceInDays(now, applied);
    }, 0);
    
    return Math.round((totalDays / interviewJobs.length) * 10) / 10;
  }, [jobs]);
  return (
    <MainLayout>
      <Header 
        title="Analytics" 
        subtitle="Visualize your job search progress" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Offer Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle>Offer Rate</CardTitle>
            <p className="text-sm text-muted-foreground">
              Percentage of applications that resulted in job offers
            </p>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke="#e9ecef" 
                  strokeWidth="10" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke="#7e57c2" 
                  strokeWidth="10" 
                  strokeDasharray={`${offerRate * 2.51} ${(100 - offerRate) * 2.51}`} 
                  strokeDashoffset="0" 
                  transform="rotate(-90 50 50)" 
                />
                <text 
                  x="50" 
                  y="55" 
                  textAnchor="middle" 
                  fontSize="20" 
                  fontWeight="bold"
                  fill="#000"
                >
                  {offerRate}%
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Average Days to Interview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Average Days to Interview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Time between application and first interview
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <div className="text-6xl font-bold">{averageDaysToInterview}</div>
            <div className="text-xl text-muted-foreground">days</div>
          </CardContent>
        </Card>

        {/* Applications Per Week Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Per Week</CardTitle>
            <p className="text-sm text-muted-foreground">
              Number of job applications submitted each week
            </p>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ChartContainer
              config={config}
              className="w-full h-full"
            >
              <BarChart
                data={weeklyApplicationData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="week" 
                  angle={-45} 
                  textAnchor="end"
                  tickMargin={10}
                />
                <YAxis domain={[0, 8]} />
                <Tooltip />
                <Bar dataKey="applications" fill="#7e57c2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution of your job applications by status
            </p>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer
              config={config}
              className="w-full aspect-[4/3]"
            >
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center" 
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Analytics;
