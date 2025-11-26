import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { JobsProvider } from "@/contexts/JobsContext";
import { KanbanProvider } from "@/contexts/KanbanContext";
import EditApplication from "./pages/EditApplication";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import AddApplication from "./pages/AddApplication";
import ResumeAnalyzerPage from "./pages/ResumeAnalyzerPage";
import Analytics from "./pages/Analytics";
import Tasks from "./pages/Tasks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <JobsProvider>
      <KanbanProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/applications/edit/:id" element={<EditApplication />} />
              <Route path="/add-application" element={<AddApplication />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
              <Route path="/analytics" element={<Analytics />} />


              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </KanbanProvider>
    </JobsProvider>
  </QueryClientProvider>
);

export default App;
