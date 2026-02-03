import { useState, useEffect } from 'react';
import { Brain, Github, X, Play, History, Trash2, Clock } from 'lucide-react';
import InputForm from './components/InputForm';
import ResultsDashboard from './components/ResultsDashboard';
import { AnalysisResult } from './types';

interface SavedAnalysis {
  id: string;
  result: AnalysisResult;
  timestamp: number;
  jobTitle?: string;
}

const STORAGE_KEY = 'career-analyses-history';
const MAX_HISTORY = 5;

const EXAMPLE_ANALYSES: SavedAnalysis[] = [
  {
    id: 'example-1',
    timestamp: Date.now() - 86400000,
    jobTitle: 'Senior Full-Stack Developer - Tech Startup',
    result: {
      matchScore: 73,
      trueIntent: {
        whatTheyWrote: "Looking for a Senior Full-Stack Developer with 5+ years experience in React, Node.js, and cloud technologies.",
        whatTheyReallyWant: "They need someone who can independently lead technical decisions and mentor junior developers.",
        keySignals: ["'Ownership' = long hours", "'Fast-paced' = understaffed", "'Wear many hats' = no boundaries", "'Competitive salary' = negotiable"]
      },
      gapAnalysis: {
        strengths: ["Strong React experience", "Startup background", "Open source contributions", "AWS certifications"],
        gaps: ["No Node.js in resume", "Missing leadership examples", "No metrics", "GraphQL not mentioned"]
      },
      quickWins: [
        { title: "Add Quantified Achievements", description: "Add specific numbers to your achievements.", impact: "high" },
        { title: "Highlight Node.js", description: "Add backend projects section.", impact: "high" }
      ]
    }
  },
  {
    id: 'example-2',
    timestamp: Date.now() - 172800000,
    jobTitle: 'Product Manager - Fintech Company',
    result: {
      matchScore: 85,
      trueIntent: {
        whatTheyWrote: "Seeking Product Manager with fintech experience to lead our payment platform team.",
        whatTheyReallyWant: "They want someone who can handle regulatory compliance while shipping fast.",
        keySignals: ["'Regulatory experience' = must-have", "'Cross-functional' = politics", "'Data-driven' = A/B testing", "'Scale' = performance issues"]
      },
      gapAnalysis: {
        strengths: ["5 years PM experience", "Fintech background", "Agile certified", "Technical understanding"],
        gaps: ["No compliance experience listed", "Missing stakeholder management", "No international experience"]
      },
      quickWins: [
        { title: "Add Compliance Section", description: "Highlight any regulatory work.", impact: "high" },
        { title: "Quantify Impact", description: "Add revenue/user metrics.", impact: "medium" }
      ]
    }
  },
  {
    id: 'example-3',
    timestamp: Date.now() - 259200000,
    jobTitle: 'DevOps Engineer - Remote SaaS',
    result: {
      matchScore: 58,
      trueIntent: {
        whatTheyWrote: "Looking for DevOps Engineer to manage our Kubernetes infrastructure and CI/CD pipelines.",
        whatTheyReallyWant: "Their infrastructure is on fire and they need someone to fix it ASAP.",
        keySignals: ["'Immediately' = emergency hire", "'On-call' = frequent incidents", "'Improve reliability' = it's broken", "'Documentation' = none exists"]
      },
      gapAnalysis: {
        strengths: ["Docker experience", "AWS knowledge", "Scripting skills"],
        gaps: ["No Kubernetes listed", "Missing Terraform", "No incident response", "No monitoring tools"]
      },
      quickWins: [
        { title: "Add K8s Projects", description: "Even personal projects count.", impact: "high" },
        { title: "List Monitoring Tools", description: "Prometheus, Grafana, etc.", impact: "high" },
        { title: "Add IaC Experience", description: "Terraform, Pulumi, CloudFormation.", impact: "medium" }
      ]
    }
  }
];

const MOCK_RESULT: AnalysisResult = {
  matchScore: 73,
  trueIntent: {
    whatTheyWrote: "Looking for a Senior Full-Stack Developer with 5+ years experience in React, Node.js, and cloud technologies. Must have strong communication skills and ability to work in an agile environment.",
    whatTheyReallyWant: "They need someone who can independently lead technical decisions, mentor junior developers, and bridge the gap between product and engineering. The 'cloud technologies' mention suggests they're planning a major infrastructure migration and need someone who won't need hand-holding.",
    keySignals: [
      "Emphasis on 'ownership' = expect long hours during crunch",
      "'Fast-paced environment' = understaffed team",
      "'Wear many hats' = no clear role boundaries",
      "'Competitive salary' = below market rate negotiable"
    ]
  },
  gapAnalysis: {
    strengths: [
      "Strong React experience (4 years) aligns with their stack",
      "Previous startup experience matches their culture",
      "Open source contributions demonstrate initiative",
      "AWS certifications cover their cloud requirements"
    ],
    gaps: [
      "No explicit Node.js mentioned in resume - add backend projects",
      "Missing leadership/mentoring experience examples",
      "No metrics or quantified achievements in current role",
      "GraphQL not mentioned but likely needed based on job keywords"
    ]
  },
  quickWins: [
    {
      title: "Add Quantified Achievements",
      description: "Replace 'Improved application performance' with 'Reduced page load time by 40% through code splitting and lazy loading, improving user retention by 15%'. Numbers make hiring managers pay attention.",
      impact: "high"
    },
    {
      title: "Highlight Node.js Experience",
      description: "Add a dedicated 'Backend Development' section showcasing any Express/Fastify APIs you've built. Even side projects count. They specifically mentioned Node.js twice.",
      impact: "high"
    },
    {
      title: "Add Leadership Keywords",
      description: "Include phrases like 'mentored 3 junior developers', 'led technical design reviews', or 'drove architectural decisions'. This role clearly needs someone senior.",
      impact: "medium"
    },
    {
      title: "Include GraphQL",
      description: "Based on their tech stack hints, add any GraphQL experience to your skills section. If you don't have production experience, mention personal projects or courses.",
      impact: "medium"
    }
  ]
};

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [showExamplesModal, setShowExamplesModal] = useState(false);

  // Ładowanie historii z localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Zapisywanie do historii
  const saveToHistory = (analysisResult: AnalysisResult) => {
    const newEntry: SavedAnalysis = {
      id: Date.now().toString(),
      result: analysisResult,
      timestamp: Date.now(),
      jobTitle: analysisResult.trueIntent.whatTheyWrote.slice(0, 50) + '...'
    };
    const updated = [newEntry, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loadFromHistory = (saved: SavedAnalysis) => {
    setResult(saved.result);
  };

  const deleteFromHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleAnalyze = async (jobDescription: string, resume: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription, resume }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed. Please try again.');
      }

      const data = await response.json();
      setResult(data);
      saveToHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const handleShowDemo = () => {
    setResult(MOCK_RESULT);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-10 h-10 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-100">
              Pragmatic Architect
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Career Agent - Decode job posts, optimize your resume, land the role
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Github className="w-3 h-3" />
            <span>AI-powered resume analysis</span>
          </div>
        </header>

        <main>
          {!result && !error && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-2xl">
              <InputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
              <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                <button
                  onClick={handleShowDemo}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <Play className="w-4 h-4" />
                  Zobacz przykładową analizę (Demo)
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                <button
                  onClick={() => setShowExamplesModal(true)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <History className="w-4 h-4" />
                  Przykładowe analizy
                </button>
              </div>
            </div>
          )}

          {/* Modal z przykładowymi analizami */}
          {showExamplesModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-400" />
                    Przykładowe analizy
                  </h2>
                  <button
                    onClick={() => setShowExamplesModal(false)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="p-4 grid md:grid-cols-3 gap-4">
                  {EXAMPLE_ANALYSES.map((example) => (
                    <button
                      key={example.id}
                      onClick={() => {
                        setResult(example.result);
                        setShowExamplesModal(false);
                      }}
                      className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-blue-500 rounded-lg p-4 text-left transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                            example.result.matchScore >= 80
                              ? 'bg-green-500/20 text-green-400'
                              : example.result.matchScore >= 60
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {example.result.matchScore}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Match Score</p>
                          <p className={`text-sm font-medium ${
                            example.result.matchScore >= 80
                              ? 'text-green-400'
                              : example.result.matchScore >= 60
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }`}>
                            {example.result.matchScore >= 80 ? 'Świetny' : example.result.matchScore >= 60 ? 'Dobry' : 'Wymaga pracy'}
                          </p>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-200 mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {example.jobTitle}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                        {example.result.trueIntent.whatTheyReallyWant}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          {example.result.gapAnalysis.strengths.length} mocne
                        </span>
                        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                          {example.result.gapAnalysis.gaps.length} luki
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-700 text-center">
                  <p className="text-xs text-gray-500">Kliknij kafelek, aby zobaczyć pełną analizę</p>
                </div>
              </div>
            </div>
          )}

          {/* Historia analiz */}
          {!result && !error && history.length > 0 && (
            <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  Ostatnie analizy
                </h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Wyczyść historię
                </button>
              </div>
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-700/50 hover:bg-gray-700 rounded-lg p-3 transition-colors group"
                  >
                    <button
                      onClick={() => loadFromHistory(item)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            item.result.matchScore >= 80
                              ? 'bg-green-500/20 text-green-400'
                              : item.result.matchScore >= 60
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {item.result.matchScore}
                        </div>
                        <div>
                          <p className="text-sm text-gray-200 line-clamp-1">
                            {item.jobTitle}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleDateString('pl-PL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFromHistory(item.id);
                      }}
                      className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {result && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100">Analysis Results</h2>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  New Analysis
                </button>
              </div>
              <ResultsDashboard result={result} />
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Built for pragmatic architects who value data over delusion</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
