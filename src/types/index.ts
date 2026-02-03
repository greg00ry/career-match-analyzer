export interface AnalysisResult {
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
    impact: 'high' | 'medium' | 'low';
  }>;
}

export interface AnalysisRequest {
  jobDescription: string;
  resume: string;
}
