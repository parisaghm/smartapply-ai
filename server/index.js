"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// --- OpenAI client ---
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new openai_1.default({ apiKey }) : null;
// Quick health check
app.get("/health", (_req, res) => {
    res.json({
        ok: true,
        openaiConfigured: Boolean(apiKey),
    });
});
app.post("/api/analyze-resume", async (req, res) => {
    if (!openai) {
        return res.status(503).json({ error: "OpenAI API key not configured" });
    }
    const { resumeText, jobDescription = "" } = (req.body ?? {});
    if (!resumeText || !resumeText.trim()) {
        return res.status(400).json({ error: "resumeText is required" });
    }
    const prompt = `
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
    let analysis = {
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
    };
    try {
        const resp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
        });
        const text = resp.choices[0]?.message?.content || "";
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const json = text.slice(jsonStart, jsonEnd + 1);
            try {
                const parsed = JSON.parse(json);
                analysis = {
                    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                    improvements: Array.isArray(parsed.improvements)
                        ? parsed.improvements
                        : [],
                    tailoring: Array.isArray(parsed.tailoring) ? parsed.tailoring : [],
                };
            }
            catch (parseErr) {
                console.warn("Failed to parse OpenAI analysis JSON:", parseErr);
            }
        }
    }
    catch (err) {
        console.error("analyze-resume: OpenAI request failed, returning fallback analysis:", err?.message || err);
    }
    return res.json(analysis);
});
const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log(`Health:      GET http://localhost:${PORT}/health`);
});
