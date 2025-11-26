import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ResumeAnalysis } from "@/types";
import { FileText, Sparkles, Upload, Briefcase, FileEdit, Download, Mail, Check, ChevronRight } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set up pdfjs worker for Vite
// Import worker file directly from node_modules using Vite's ?url import
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

const ResumeAnalyzer: React.FC = () => {
  const { toast } = useToast();
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingPDF, setIsProcessingPDF] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("coverLetter");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync active tab when analysis changes - prioritize resume content over cover letter
  useEffect(() => {
    if (analysis) {
      // When analysis is set (e.g., from "Edit Resume"), show resume-related tabs first
      if (analysis.specificChanges) {
        setActiveTab("changes");
      } else if (analysis.customizedResume) {
        setActiveTab("customized");
      } else if (analysis.coverLetter) {
        setActiveTab("coverLetter");
      }
      
      // Auto-scroll to results after analysis completes
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [analysis]);

  const handleFileUpload = async (file: File) => {
    // Only accept PDF files
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingPDF(true);

    try {
      // Read PDF file and extract text
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      }).promise;

      let extractedText = "";

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => {
            if ('str' in item && typeof item.str === 'string') {
              return item.str;
            }
            return '';
          })
          .join(" ");
        extractedText += pageText + "\n";
      }

      setResumeText(extractedText.trim());

      toast({
        title: "PDF uploaded successfully",
        description: `${file.name} has been uploaded and processed.`,
      });
    } catch (error) {
      console.error("Error parsing PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Error reading PDF",
        description: `Failed to extract text from the PDF: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
      setUploadedFile(null);
      setResumeText("");
    } finally {
      setIsProcessingPDF(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDownloadResume = () => {
    if (!analysis?.customizedResume) return;

    const blob = new Blob([analysis.customizedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customized-resume.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Resume downloaded as text file",
    });
  };

  // Calculate current step
  const getCurrentStep = (): number => {
    if (analysis) return 3; // Step 3: Results shown
    if (uploadedFile && jobDescription.trim()) return 2; // Step 2: Both ready, can analyze (or analyzing)
    if (uploadedFile) return 1; // Step 1: File uploaded, still on step 1
    return 1; // Step 1: Starting - need to upload file
  };

  // Check if step is completed
  const isStepCompleted = (step: number): boolean => {
    if (step === 1) return uploadedFile !== null;
    if (step === 2) return analysis !== null;
    return false;
  };

  const currentStep = getCurrentStep();

  const handleDownloadCoverLetter = () => {
    if (!analysis?.coverLetter) return;

    const blob = new Blob([analysis.coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cover-letter.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Cover letter downloaded as text file",
    });
  };

  const handleGenerateCoverLetter = async () => {
    if (!resumeText.trim()) {
      toast({
        title: "Error",
        description: "Please upload your resume PDF first.",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Error",
        description: "Please provide a job description to generate a cover letter.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingCoverLetter(true);

      const resp = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription.trim(),
        }),
      });

      if (!resp.ok) {
        let message = `Server error: ${resp.status}`;
        try {
          const maybeErr = (await resp.json()) as unknown;
          const err = maybeErr as { error?: string };
          if (err?.error) message = err.error;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(message);
      }

      const raw = (await resp.json()) as unknown;
      const rawAnalysis = raw as {
        coverLetter?: unknown;
        strengths?: unknown;
        improvements?: unknown;
        tailoring?: unknown;
      };

      console.log("Cover letter response:", rawAnalysis);

      if (rawAnalysis.coverLetter && typeof rawAnalysis.coverLetter === "string") {
        const coverLetterText = rawAnalysis.coverLetter as string;

        // Check if the cover letter is an error message
        if (coverLetterText.includes("generation failed") || coverLetterText.includes("empty response")) {
          throw new Error(coverLetterText);
        }

        setAnalysis((prev) => ({
          ...prev || {
            strengths: Array.isArray(rawAnalysis.strengths) ? (rawAnalysis.strengths as string[]) : [],
            improvements: Array.isArray(rawAnalysis.improvements) ? (rawAnalysis.improvements as string[]) : [],
            tailoring: Array.isArray(rawAnalysis.tailoring) ? (rawAnalysis.tailoring as string[]) : [],
          },
          coverLetter: coverLetterText,
        }));

        // Set active tab to cover letter
        setActiveTab("coverLetter");

        toast({
          title: "Cover Letter Generated! ✨",
          description: "Your personalized cover letter is ready.",
        });
      } else {
        console.error("Cover letter not found in response:", rawAnalysis);
        throw new Error("Cover letter was not generated. The server response did not include a cover letter. Please check the server logs or try again.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      console.error(err);
      toast({
        title: "Cover letter generation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };


  const handleAnalyze = async () => {
    if (!uploadedFile || !resumeText.trim()) {
      toast({
        title: "Error",
        description: "Please upload your resume PDF.",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Error",
        description: "Please provide a job description to customize your resume.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);

      const resp = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription.trim(),
        }),
      });

      if (!resp.ok) {
        let message = `Server error: ${resp.status}`;
        try {
          const maybeErr = (await resp.json()) as unknown;
          const err = maybeErr as { error?: string };
          if (err?.error) message = err.error;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(message);
      }

      // Safely coerce to our expected shape
      const raw = (await resp.json()) as unknown;
      const rawAnalysis = raw as {
        strengths?: unknown;
        improvements?: unknown;
        tailoring?: unknown;
        customizedResume?: unknown;
        specificChanges?: unknown;
        coverLetter?: unknown;
      };

      const sane: ResumeAnalysis = {
        strengths: Array.isArray(rawAnalysis.strengths)
          ? (rawAnalysis.strengths as string[])
          : [],
        improvements: Array.isArray(rawAnalysis.improvements)
          ? (rawAnalysis.improvements as string[])
          : [],
        tailoring: Array.isArray(rawAnalysis.tailoring)
          ? (rawAnalysis.tailoring as string[])
          : [],
        customizedResume: typeof rawAnalysis.customizedResume === "string"
          ? rawAnalysis.customizedResume
          : undefined,
        specificChanges: typeof rawAnalysis.specificChanges === "string"
          ? rawAnalysis.specificChanges
          : undefined,
        coverLetter: typeof rawAnalysis.coverLetter === "string"
          ? rawAnalysis.coverLetter
          : undefined,
      };

      setAnalysis(sane);

      toast({
        title: "Analysis Complete! ✨",
        description: "Your resume has been analyzed with AI.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      console.error(err);
      toast({
        title: "Analysis failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Step Progress Indicator */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-3 border-b">
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {/* Step 1 */}
          <div className={`flex items-center gap-2 ${isStepCompleted(1) || currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isStepCompleted(1)
                ? 'bg-primary border-primary text-primary-foreground'
                : currentStep === 1
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted-foreground bg-background'
              }`}>
              {isStepCompleted(1) ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-semibold">1</span>
              )}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${isStepCompleted(1) || currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              Upload Resume
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground" />

          {/* Step 2 */}
          <div className={`flex items-center gap-2 ${isStepCompleted(2) || currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isStepCompleted(2)
                ? 'bg-primary border-primary text-primary-foreground'
                : currentStep === 2
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted-foreground bg-background'
              }`}>
              {isStepCompleted(2) ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-semibold">2</span>
              )}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${isStepCompleted(2) || currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              Job Description
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground" />

          {/* Step 3 */}
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep === 3
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-muted-foreground bg-background'
              }`}>
              <span className="text-sm font-semibold">3</span>
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              Results
            </span>
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="text-xs font-medium text-primary">
            🪄 Step {currentStep} of 3
          </span>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-background to-secondary/5 border-t">
        <CardHeader className="text-center pb-3 pt-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AI Resume Analyzer
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload your resume PDF and add the job description. ChatGPT will customize your resume and automatically generate a personalized cover letter based on the job description. Output is formatted text (not PDF).
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* PDF Upload Area */}
          <div className="space-y-2 border-b pb-4">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Step 1: Upload Resume PDF</span>
            </Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 cursor-pointer
                ${isDragging ? "border-primary bg-primary/5 scale-105" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"}
                ${uploadedFile ? "border-primary bg-primary/5" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {isProcessingPDF ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                  <p className="text-sm font-medium text-primary">Processing PDF...</p>
                  <p className="text-xs text-muted-foreground">Extracting text from your resume</p>
                </div>
              ) : uploadedFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-primary mx-auto" />
                  <div>
                    <p className="font-medium text-primary text-sm">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                      setResumeText("");
                    }}
                  >
                    Remove PDF
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-sm font-medium">
                      {isDragging ? "Drop PDF here" : "Upload PDF file"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF only (max 5MB)
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-3 w-3 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Job Description Input */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="jobDescription" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>Step 2: Job Description <span className="text-destructive">*</span></span>
            </Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here. ChatGPT will edit your resume to match these requirements..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-32 resize-y"
            />
            <p className="text-xs text-muted-foreground">
              <strong>Required:</strong> Add the job description and ChatGPT will edit your resume where needed.
            </p>
          </div>

        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t bg-muted/20">
          <div className="flex-1 text-sm text-muted-foreground">
            {uploadedFile && jobDescription ? (
              <span className="text-primary font-medium">
                ✓ Ready to customize (PDF uploaded, {jobDescription.length} chars job description)
              </span>
            ) : uploadedFile ? (
              <span className="text-orange-600 dark:text-orange-400">
                ⚠ Add job description to customize resume
              </span>
            ) : (
              "Upload your resume PDF and add job description to get started"
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateCoverLetter}
              disabled={isGeneratingCoverLetter || !uploadedFile || !resumeText || !jobDescription.trim()}
              size="lg"
              variant="outline"
              className="min-w-[180px]"
            >
              {isGeneratingCoverLetter ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !uploadedFile || !resumeText || !jobDescription.trim()}
              size="lg"
              className="min-w-[160px]"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Editing Resume...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Edit Resume with ChatGPT
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card ref={resultsRef} className="shadow-lg border-primary/10 border-t">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Resume Analysis Results</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ChatGPT has edited your resume to match the job description. Output is formatted text (not PDF).
            </p>
          </CardHeader>

          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
              <TabsList className={`grid w-full h-12 bg-muted/50 ${[analysis.coverLetter, analysis.customizedResume, analysis.specificChanges].filter(Boolean).length === 3
                ? "grid-cols-3"
                : [analysis.coverLetter, analysis.customizedResume, analysis.specificChanges].filter(Boolean).length === 2
                  ? "grid-cols-2"
                  : "grid-cols-1"
                }`}>
                {analysis.coverLetter && (
                  <TabsTrigger
                    value="coverLetter"
                    className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Mail className="h-4 w-4 mr-1 inline" />
                    Cover Letter
                  </TabsTrigger>
                )}
                {analysis.specificChanges && (
                  <TabsTrigger
                    value="changes"
                    className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    📝 Changes Needed
                  </TabsTrigger>
                )}
                {analysis.customizedResume && (
                  <TabsTrigger
                    value="customized"
                    className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <FileEdit className="h-4 w-4 mr-1 inline" />
                    Customized Resume
                  </TabsTrigger>
                )}
              </TabsList>

              {analysis.specificChanges && (
                <TabsContent value="changes" className="space-y-3">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border-2 border-amber-200 dark:border-amber-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileEdit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                        Specific Changes Needed
                      </h3>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="font-sans text-sm text-gray-800 dark:text-gray-200 leading-normal whitespace-pre-wrap">
                          {analysis.specificChanges.split('\n').map((line, index) => {
                            const trimmedLine = line.trim();

                            // Format SECTION headers
                            if (trimmedLine.startsWith('SECTION:')) {
                              const sectionName = trimmedLine.replace('SECTION:', '').trim();
                              return (
                                <div key={index} className="mt-3 mb-2 first:mt-0">
                                  <h4 className="font-bold text-base text-amber-700 dark:text-amber-300 uppercase tracking-wide border-b-2 border-amber-300 dark:border-amber-600 pb-1">
                                    {sectionName}
                                  </h4>
                                </div>
                              );
                            }

                            // Format CURRENT labels
                            if (trimmedLine.startsWith('CURRENT:')) {
                              const currentText = trimmedLine.replace('CURRENT:', '').trim();
                              return (
                                <div key={index} className="mb-2">
                                  <span className="font-semibold text-red-600 dark:text-red-400 mr-2">CURRENT:</span>
                                  <span className="text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
                                    {currentText}
                                  </span>
                                </div>
                              );
                            }

                            // Format CHANGE TO labels
                            if (trimmedLine.startsWith('CHANGE TO:')) {
                              const changeText = trimmedLine.replace('CHANGE TO:', '').trim();
                              return (
                                <div key={index} className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                  <span className="font-semibold text-green-600 dark:text-green-400 mr-2">CHANGE TO:</span>
                                  <span className="text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded">
                                    {changeText}
                                  </span>
                                </div>
                              );
                            }

                            // Empty lines
                            if (trimmedLine.length === 0) {
                              return <div key={index} className="mb-1">&nbsp;</div>;
                            }

                            // Regular text lines
                            return (
                              <div key={index} className="mb-1">
                                {trimmedLine}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        💡 <strong>Tip:</strong> These are specific places in your resume that need to be changed to better match the job description.
                        Review each section and update your resume accordingly.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              )}

              {analysis.coverLetter && (
                <TabsContent value="coverLetter" className="space-y-3">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                          Your Customized Cover Letter
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(analysis.coverLetter || "");
                            toast({
                              title: "Copied!",
                              description: "Cover letter copied to clipboard",
                            });
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Copy Text
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleDownloadCoverLetter}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                          {analysis.coverLetter.split('\n').map((line, index, array) => {
                            const trimmedLine = line.trim();
                            const isEmpty = trimmedLine.length === 0;
                            const prevLine = index > 0 ? array[index - 1].trim() : '';
                            const nextLine = index < array.length - 1 ? array[index + 1].trim() : '';
                            const prevPrevLine = index > 1 ? array[index - 2].trim() : '';

                            // Empty lines
                            if (isEmpty) {
                              return <div key={index} className="mb-1">&nbsp;</div>;
                            }

                            // Check if it's "COVER LETTER" title (centered, uppercase)
                            if (trimmedLine === 'COVER LETTER' || (trimmedLine.includes('COVER LETTER') && trimmedLine === trimmedLine.toUpperCase())) {
                              return (
                                <div key={index} className="text-center mb-2">
                                  <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{trimmedLine}</h2>
                                </div>
                              );
                            }

                            // Check if it's a divider line (dashes or equals)
                            if ((trimmedLine.startsWith('---') || trimmedLine.startsWith('===') || trimmedLine.match(/^[-=]{3,}$/)) && trimmedLine.length > 10) {
                              return (
                                <div key={index} className="my-2 border-b-2 border-indigo-300 dark:border-indigo-700"></div>
                              );
                            }

                            // Check if it's likely the candidate's name (centered, at the beginning, no email/phone)
                            // Skip if previous line was already processed as name
                            if (index < 5 && !trimmedLine.includes('@') && !trimmedLine.match(/^\+?\d/) && !trimmedLine.includes('linkedin') &&
                              !trimmedLine.includes('Date:') && !trimmedLine.includes('Dear') && trimmedLine.length > 3 && trimmedLine.length < 50 &&
                              prevLine !== '' && !prevLine.match(/^[-=]{3,}$/)) {
                              // Check if next line might be a title (and we haven't already processed it)
                              if (nextLine && nextLine.length < 50 && !nextLine.includes('@') && !nextLine.match(/^\+?\d/) &&
                                !nextLine.includes('linkedin') && !nextLine.includes('Date:') && !nextLine.includes('Dear')) {
                                // Return both name and title together, skip next line
                                return (
                                  <React.Fragment key={index}>
                                    <div className="text-center mb-2">
                                      <h1 className="text-2xl font-bold mb-0.5">{trimmedLine}</h1>
                                      <p className="text-base font-normal text-gray-600 dark:text-gray-400">{nextLine}</p>
                                    </div>
                                    {/* Skip next line by returning null for it */}
                                    {array[index + 1] && <div key={`skip-${index + 1}`} style={{ display: 'none' }} />}
                                  </React.Fragment>
                                );
                              } else if (index === 0 || (index === 1 && prevLine === '')) {
                                // Just the name, no title
                                return (
                                  <div key={index} className="text-center mb-1">
                                    <h1 className="text-2xl font-bold">{trimmedLine}</h1>
                                  </div>
                                );
                              }
                            }

                            // Check if it's contact info section (phone, email, LinkedIn) - format in two columns
                            if (index < 10 && (trimmedLine.includes('@') || trimmedLine.match(/^\+?\d/) || trimmedLine.toLowerCase().includes('linkedin'))) {
                              // Check if there's a LinkedIn on the same or next line for right alignment
                              const hasLinkedIn = trimmedLine.toLowerCase().includes('linkedin') ||
                                (nextLine && nextLine.toLowerCase().includes('linkedin'));

                              if (hasLinkedIn && trimmedLine.toLowerCase().includes('linkedin')) {
                                return (
                                  <div key={index} className="flex justify-between mb-1 text-xs">
                                    <div></div>
                                    <div>{trimmedLine}</div>
                                  </div>
                                );
                              } else if (!trimmedLine.toLowerCase().includes('linkedin')) {
                                return (
                                  <div key={index} className="mb-1 text-xs">
                                    {trimmedLine}
                                  </div>
                                );
                              }
                            }

                            // Check if it's a date line
                            if (trimmedLine.startsWith('Date:') || trimmedLine.match(/^Date:\s/)) {
                              return (
                                <div key={index} className="mb-1">
                                  <p className="font-medium">{trimmedLine}</p>
                                </div>
                              );
                            }

                            // Check if it's a salutation
                            if (trimmedLine.startsWith('Dear') && trimmedLine.endsWith(',')) {
                              return (
                                <div key={index} className="mb-2">
                                  <p className="font-medium">{trimmedLine}</p>
                                </div>
                              );
                            }

                            // Check if it's a closing (Sincerely,)
                            if (trimmedLine === 'Sincerely,' || trimmedLine === 'Best regards,' || trimmedLine === 'Regards,') {
                              return (
                                <div key={index} className="mt-3 mb-1">
                                  <p className="font-medium">{trimmedLine}</p>
                                </div>
                              );
                            }

                            // Check if it's a name at the end (after Sincerely)
                            if (prevLine === 'Sincerely,' || prevLine === 'Best regards,' || prevLine === 'Regards,') {
                              return (
                                <div key={index} className="mb-2">
                                  <p className="font-medium">{trimmedLine}</p>
                                </div>
                              );
                            }

                            // Regular paragraphs
                            return (
                              <p key={index} className="mb-2 leading-normal">
                                {trimmedLine}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <p className="text-xs text-indigo-800 dark:text-indigo-200">
                        💡 <strong>Tip:</strong> ChatGPT has generated a personalized cover letter based on your resume and the job description.
                        Review and customize it further to add your personal touch before submitting.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              )}

              {analysis.customizedResume && (
                <TabsContent value="customized" className="space-y-3">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border-2 border-purple-200 dark:border-purple-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileEdit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                          Your Customized Resume (Formatted Text)
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(analysis.customizedResume || "");
                            toast({
                              title: "Copied!",
                              description: "Customized resume copied to clipboard",
                            });
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Copy Text
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleDownloadResume}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download as Text
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                          {analysis.customizedResume.split('\n').map((line, index, array) => {
                            const trimmedLine = line.trim();
                            const isEmpty = trimmedLine.length === 0;
                            const prevLine = index > 0 ? array[index - 1].trim() : '';
                            const nextLine = index < array.length - 1 ? array[index + 1].trim() : '';

                            // Skip consecutive empty lines
                            if (isEmpty && prevLine === '') {
                              return <React.Fragment key={index} />;
                            }

                            // Format section headers (typically short, all caps, or followed by empty line)
                            const isHeader = trimmedLine.length > 0 &&
                              trimmedLine.length < 60 &&
                              !trimmedLine.includes('•') &&
                              !trimmedLine.includes('-') &&
                              !trimmedLine.includes('@') &&
                              !trimmedLine.includes('http') &&
                              (trimmedLine === trimmedLine.toUpperCase() || nextLine === '' || nextLine.startsWith('•') || nextLine.startsWith('-'));

                            if (isHeader) {
                              return (
                                <div key={index} className="mt-3 mb-2 first:mt-0">
                                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 uppercase tracking-wide border-b-2 border-gray-400 dark:border-gray-500 pb-1">
                                    {trimmedLine}
                                  </h4>
                                </div>
                              );
                            }

                            // Format bullet points
                            if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
                              const bulletContent = trimmedLine.substring(1).trim();
                              return (
                                <div key={index} className="ml-6 mb-1 flex items-start">
                                  <span className="mr-3 text-purple-600 dark:text-purple-400 mt-1">•</span>
                                  <span className="flex-1">{bulletContent}</span>
                                </div>
                              );
                            }

                            // Format lines that look like dates or job titles (contain dates in parentheses)
                            if (trimmedLine.includes('(') && trimmedLine.includes(')') && trimmedLine.length < 80) {
                              return (
                                <div key={index} className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
                                  {trimmedLine}
                                </div>
                              );
                            }

                            // Empty lines
                            if (isEmpty) {
                              return <div key={index} className="mb-1">&nbsp;</div>;
                            }

                            // Regular text lines
                            return (
                              <div key={index} className="mb-1">
                                {trimmedLine}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        💡 <strong>Tip:</strong> ChatGPT has edited your resume to match the job description.
                        The output is formatted text (not PDF). You can copy the text or download it as a .txt file.
                        Review and edit as needed before submitting your application.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
