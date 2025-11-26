// server/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// Type declaration for Node.js process
declare const process: {
  env: {
    [key: string]: string | undefined;
    OPENAI_API_KEY?: string;
    PORT?: string;
  };
};

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large resume text

// --- OpenAI client ---
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Quick health check
app.get("/health", (_req: express.Request, res: express.Response) => {
  res.json({
    ok: true,
    openaiConfigured: Boolean(apiKey),
  });
});

type Analysis = {
  strengths: string[];
  improvements: string[];
  tailoring: string[];
  customizedResume?: string;
  specificChanges?: string;
  coverLetter?: string;
};

app.post("/api/analyze-resume", async (req: express.Request, res: express.Response) => {
  try {
    console.log("analyze-resume: Request received");
    console.log("analyze-resume: Request body keys:", Object.keys(req.body || {}));
    
    if (!openai) {
      console.error("analyze-resume: OpenAI not configured");
      return res.status(503).json({ error: "OpenAI API key not configured" });
    }

    const { resumeText, jobDescription = "" } = (req.body ?? {}) as {
      resumeText?: string;
      jobDescription?: string;
    };

    if (!resumeText || !resumeText.trim()) {
      console.error("analyze-resume: resumeText is missing");
      return res.status(400).json({ error: "resumeText is required" });
    }

    console.log(`analyze-resume: Processing resume (${resumeText.length} chars) and job description (${jobDescription.length} chars)`);

    const analysisPrompt = `
You are a resume coach. Given the resume text and optional job description,
return STRICT JSON with keys: strengths, improvements, tailoring (arrays of strings).
No prose. Example:
{
  "strengths": ["..."],
  "improvements": ["..."],
  "tailoring": ["..."]
}

Resume:
${resumeText}

Job description (optional):
${jobDescription}
`.trim();

    const customizePrompt = jobDescription.trim()
      ? `
You are a professional resume writer. Customize the following resume to match the job description provided.
Rewrite the resume to highlight relevant skills, experiences, and achievements that align with the job requirements.

IMPORTANT STYLE GUIDELINES:
- Write in natural, human language that flows smoothly when read aloud
- Use conversational yet professional tone - avoid robotic or overly formal language
- Make descriptions sound authentic and engaging, as if a person is speaking about their experience
- Use active voice and clear, concise sentences
- Ensure the text reads naturally when spoken out loud
- Keep the same format and structure, but tailor the content, keywords, and emphasis to match the job description

Original Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY the customized resume text. Do not include any explanations or additional text.
`.trim()
      : null;

    const specificChangesPrompt = jobDescription.trim()
      ? `
You are a resume editor. Analyze the resume and job description, then provide a clear, formatted list of specific places in the resume that need to be changed.

IMPORTANT GUIDELINES:
- DO NOT suggest changes to Education sections. Education information (degrees, institutions, dates) should remain as-is unless there are critical factual errors.
- Only suggest changes that are directly relevant to matching the job description requirements.
- Focus on: Professional Summary, Work Experience descriptions, Skills sections, and relevant achievements.
- Do not suggest adding dates or years to education entries if they are not already present.

For each change, specify:
1. The section/section name (e.g., "Professional Summary", "Work Experience - Software Engineer at Company X", "Skills Section")
2. What currently exists (the current text or description)
3. What it should be changed to (the suggested change)

Format your response as clear, readable text with sections. Use this format:

SECTION: [Section Name]
CURRENT: [What currently exists]
CHANGE TO: [What it should be changed to]

[Repeat for each change]

Original Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY the list of specific changes in the format above. Be specific about locations and exact text changes. Remember: DO NOT suggest changes to Education sections.
`.trim()
      : null;

    const analysis: Analysis = {
      strengths: [
        "Solid technical foundation communicated clearly.",
        "Highlights relevant experience and impact-driven bullet points.",
      ],
      improvements: [
        "Quantify achievements (e.g., impact, metrics) wherever possible.",
        "Add a short summary that aligns with the target role's keywords.",
      ],
      tailoring: [
        "Mirror key phrases from the job description in the skills section.",
        "Mention recent projects that demonstrate the required tools or domains.",
      ],
      // Initialize coverLetter as undefined - will be set if job description is provided
      coverLetter: undefined,
    };

    try {
      console.log("analyze-resume: Starting OpenAI analysis request");
      // Get analysis
      const analysisResp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.7,
      }).catch((err) => {
        console.error("analyze-resume: OpenAI API error:", err);
        throw err;
      });
      console.log("analyze-resume: Analysis request completed");

      const analysisText = analysisResp.choices[0]?.message?.content || "";

      // Try to locate JSON in the response
      const jsonStart = analysisText.indexOf("{");
      const jsonEnd = analysisText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const json = analysisText.slice(jsonStart, jsonEnd + 1);
        try {
          const parsed = JSON.parse(json);
          analysis.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
          analysis.improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];
          analysis.tailoring = Array.isArray(parsed.tailoring) ? parsed.tailoring : [];
        } catch (parseErr) {
          console.warn("Failed to parse OpenAI analysis JSON:", parseErr);
        }
      }

      // Get customized resume if job description is provided
      if (customizePrompt) {
        try {
          console.log("analyze-resume: Starting customized resume request");
          const customizeResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: customizePrompt,
              },
            ],
            temperature: 0.7,
          }).catch((err) => {
            console.error("analyze-resume: Customized resume API error:", err);
            throw err;
          });

          const customizedResume = customizeResp.choices[0]?.message?.content || "";
          if (customizedResume.trim()) {
            analysis.customizedResume = customizedResume.trim();
          }
        } catch (customizeErr) {
          console.error("Failed to generate customized resume:", customizeErr);
        }
      }

      // Get specific changes if job description is provided
      if (specificChangesPrompt) {
        try {
          console.log("analyze-resume: Starting specific changes request");
          const changesResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: specificChangesPrompt,
              },
            ],
            temperature: 0.7,
          }).catch((err) => {
            console.error("analyze-resume: Specific changes API error:", err);
            throw err;
          });

          const specificChanges = changesResp.choices[0]?.message?.content || "";
          if (specificChanges.trim()) {
            analysis.specificChanges = specificChanges.trim();
            console.log("analyze-resume: Specific changes generated successfully");
          }
        } catch (changesErr) {
          console.error("Failed to generate specific changes:", changesErr);
          if (changesErr instanceof Error) {
            console.error("Error details:", changesErr.message, changesErr.stack);
          }
        }
      }

      // Generate cover letter automatically if job description is provided
      if (jobDescription.trim()) {
        try {
          console.log("analyze-resume: Starting cover letter generation request");
          const coverLetterPrompt = `
You are a professional cover letter writer. Write a compelling, personalized cover letter based on the resume and job description provided.

EXACT FORMATTING STRUCTURE (follow this order exactly):

1. HEADER SECTION (centered):
   - Candidate's full name (centered, bold/large)
   - Job title/position (centered, below name, smaller font)
   - Blank line

2. CONTACT INFORMATION (two columns):
   - Left side: Phone number, Email address (each on separate line)
   - Right side: LinkedIn profile URL (if available in resume)
   - Blank line

3. DIVIDER LINE:
   - Horizontal line using dashes or equal signs (at least 30 characters)
   - Blank line

4. TITLE:
   - "COVER LETTER" (centered, uppercase, can be in blue/colored if specified)
   - Blank line

5. DATE:
   - "Date: [Current Date]" (left-aligned, use format: Month Day, Year, e.g., "Date: November 7, 2025")
   - Blank line

6. SALUTATION:
   - "Dear Hiring Manager," (left-aligned)
   - Blank line

7. BODY (4-5 paragraphs):
   - Each paragraph should be left-aligned
   - Separate paragraphs with blank lines
   - First paragraph: Express excitement and introduce yourself
   - Middle paragraphs: Highlight relevant experience, skills, and achievements from resume
   - Last paragraph: Show enthusiasm for the role and company
   - Blank line between paragraphs

8. CLOSING:
   - "Sincerely," (left-aligned)
   - Blank line
   - Candidate's full name (left-aligned, below Sincerely)

CONTENT GUIDELINES:
- Extract candidate's name, job title, phone, email, and LinkedIn from the resume
- Use actual information from the resume - do not use placeholders
- Address how the candidate's skills and experience align with the job requirements
- Highlight specific achievements and experiences from the resume that are relevant to the job
- Show enthusiasm for the position and company
- Use a professional but engaging tone
- Write 4-5 well-structured paragraphs

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY the formatted cover letter text following the exact structure above. Use proper line breaks and spacing. Do not include any explanations or additional text.
`.trim();

          const coverLetterResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: coverLetterPrompt,
              },
            ],
            temperature: 0.8,
          }).catch((err) => {
            console.error("analyze-resume: Cover letter API error:", err);
            throw err;
          });

          const coverLetter = coverLetterResp.choices[0]?.message?.content || "";
          if (coverLetter.trim()) {
            analysis.coverLetter = coverLetter.trim();
            console.log("analyze-resume: Cover letter generated successfully");
          } else {
            console.warn("analyze-resume: Cover letter response was empty");
            analysis.coverLetter = "Cover letter generation returned an empty response. Please try again.";
          }
        } catch (coverLetterErr) {
          console.error("Failed to generate cover letter:", coverLetterErr);
          if (coverLetterErr instanceof Error) {
            console.error("Error details:", coverLetterErr.message, coverLetterErr.stack);
          }
          // Set a fallback message instead of silently failing
          analysis.coverLetter = `Cover letter generation failed: ${coverLetterErr instanceof Error ? coverLetterErr.message : "Unknown error"}. Please try again.`;
        }
      }
      console.log("analyze-resume: All OpenAI requests completed, returning analysis");
    } catch (err: unknown) {
      console.error(
        "analyze-resume: OpenAI request failed, returning fallback analysis:",
        err instanceof Error ? err.message : err,
      );
      if (err instanceof Error) {
        console.error("Error stack:", err.stack);
      }
    }

    console.log("analyze-resume: Sending response");
    return res.json(analysis);
  } catch (err: unknown) {
    console.error("analyze-resume: Unexpected error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error("Error stack:", errorStack);
    return res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
});

// Error handling middleware (must be after all routes)
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  if (!res.headersSent) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
});

const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Health:      GET http://localhost:${PORT}/health`);
});
