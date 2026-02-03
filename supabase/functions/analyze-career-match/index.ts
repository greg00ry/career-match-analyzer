import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  jobDescription: string;
  resume: string;
}

interface AnalysisResult {
  matchScore: number;
  trueIntent: {
    whatTheyWrote: string;
    whatTheyReallyWant: string;
    keySignals: string[];
  };
  gapAnalysis: {
    strengths: string[];
    gaps: string[];
  };
  quickWins: Array<{
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
  }>;
}

async function analyzeWithOpenAI(
  jobDescription: string,
  resume: string
): Promise<AnalysisResult> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `You are an expert career coach and ATS (Applicant Tracking System) specialist. Analyze the following job description and resume, then provide a detailed assessment.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resume}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no other text):
{
  "matchScore": <number between 0-100>,
  "trueIntent": {
    "whatTheyWrote": "<brief summary of the literal job description>",
    "whatTheyReallyWant": "<what the company actually needs based on reading between the lines>",
    "keySignals": ["<signal 1>", "<signal 2>", "<signal 3>", "<signal 4>"]
  },
  "gapAnalysis": {
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>"],
    "gaps": ["<gap 1>", "<gap 2>", "<gap 3>", "<gap 4>"]
  },
  "quickWins": [
    {
      "title": "<specific action title>",
      "description": "<detailed explanation of what to change and why>",
      "impact": "high"
    },
    {
      "title": "<specific action title>",
      "description": "<detailed explanation of what to change and why>",
      "impact": "high"
    },
    {
      "title": "<specific action title>",
      "description": "<detailed explanation of what to change and why>",
      "impact": "medium"
    }
  ]
}

Focus on:
- ATS optimization (keywords, formatting)
- What will impress the hiring manager beyond ATS
- Specific, actionable changes
- Reading between the lines of the job post`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach specializing in resume optimization and ATS systems. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  let result: AnalysisResult;
  try {
    result = JSON.parse(content);
  } catch {
    throw new Error("Failed to parse AI response");
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { jobDescription, resume }: AnalysisRequest = await req.json();

    if (!jobDescription || !resume) {
      return new Response(
        JSON.stringify({ error: "Job description and resume are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await analyzeWithOpenAI(jobDescription, resume);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from("career_analyses").insert({
        job_description: jobDescription,
        resume: resume,
        match_score: result.matchScore,
        true_intent: result.trueIntent,
        gap_analysis: result.gapAnalysis,
        quick_wins: result.quickWins,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Analysis failed",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
