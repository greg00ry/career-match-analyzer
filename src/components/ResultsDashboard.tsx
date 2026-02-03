import { Target, TrendingUp, Zap, Eye, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultsDashboardProps {
  result: AnalysisResult;
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreRing = (score: number) => {
    if (score >= 80) return 'stroke-green-400';
    if (score >= 60) return 'stroke-yellow-400';
    return 'stroke-red-400';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (result.matchScore / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-40 h-40">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle
                cx="80"
                cy="80"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-700"
              />
              <circle
                cx="80"
                cy="80"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${getScoreRing(result.matchScore)} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(result.matchScore)}`}>
                  {result.matchScore}
                </div>
                <div className="text-xs text-gray-400">MATCH</div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Match Score Analysis
              </h3>
              <p className="text-gray-400">
                {result.matchScore >= 80 && "Strong match. You're well-positioned for this role."}
                {result.matchScore >= 60 && result.matchScore < 80 && "Good potential. Some adjustments will strengthen your application."}
                {result.matchScore < 60 && "Significant gaps detected. Focus on the quick wins below."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-400" />
          True Intent Analysis
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">What They Wrote:</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{result.trueIntent.whatTheyWrote}</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-blue-400 mb-2">What They Really Want:</h4>
            <p className="text-gray-100 text-sm leading-relaxed font-medium">{result.trueIntent.whatTheyReallyWant}</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Key Signals:</h4>
            <div className="flex flex-wrap gap-2">
              {result.trueIntent.keySignals.map((signal, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Your Strengths
          </h3>
          <ul className="space-y-2">
            {result.gapAnalysis.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Identified Gaps
          </h3>
          <ul className="space-y-2">
            {result.gapAnalysis.gaps.map((gap, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-blue-700/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          Quick Wins - Apply These Now
        </h3>
        <div className="space-y-4">
          {result.quickWins.map((win, index) => (
            <div
              key={index}
              className="bg-gray-800/80 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-100 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm">
                    {index + 1}
                  </span>
                  {win.title}
                </h4>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    win.impact === 'high'
                      ? 'bg-red-900/50 text-red-300'
                      : win.impact === 'medium'
                      ? 'bg-yellow-900/50 text-yellow-300'
                      : 'bg-blue-900/50 text-blue-300'
                  }`}
                >
                  {win.impact.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{win.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
