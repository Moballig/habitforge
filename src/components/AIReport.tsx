'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Heart, RefreshCw } from 'lucide-react';

interface Analysis {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  tip: string;
  motivation: string;
}

interface AIReportProps {
  habits: unknown[];
  logs: unknown[];
}

export default function AIReport({ habits, logs }: AIReportProps) {
  const analyzeAction = useAction(api.ai.analyze);
  const [report, setReport] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const data = await analyzeAction({
        habits: habits as never,
        logs: logs as never,
      });

      if (data.analysis && typeof data.analysis.overallScore === 'number') {
        setReport(data.analysis as Analysis);
      } else {
        setError(
          (data as { error?: string }).error ||
            'Could not generate a report right now. Please try again.'
        );
      }
    } catch {
      setError('Something went wrong while contacting the AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    report && report.overallScore >= 70
      ? '#10B981'
      : report && report.overallScore >= 40
        ? '#F59E0B'
        : '#EF4444';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Weekly Report</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Personalized analysis of your week
            </p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 shadow-lg shadow-indigo-500/25 transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : report ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading && !report && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reading your habit data and writing your report...
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Report unavailable
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!report && !loading && !error && (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              See how your week went
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Get an AI-powered score, strengths, areas to improve, and one tip for next week.
            </p>
          </div>
        )}

        {report && (
          <div className="animate-fade-in space-y-5">
            {/* Score + summary */}
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div
                className="relative w-24 h-24 rounded-full flex-shrink-0"
                style={{
                  background: `conic-gradient(${scoreColor} ${report.overallScore * 3.6}deg, #e5e7eb 0deg)`,
                }}
              >
                <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {report.overallScore}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">score</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                {report.summary}
              </p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                    Strengths
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-emerald-800 dark:text-emerald-300 flex gap-1.5">
                      <span className="text-emerald-500">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Focus Areas
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {report.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex gap-1.5">
                      <span className="text-amber-500">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tip */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
              <Lightbulb className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                  Tip for next week
                </p>
                <p className="text-sm text-indigo-900 dark:text-indigo-200">{report.tip}</p>
              </div>
            </div>

            {/* Motivation */}
            <div className="flex items-center gap-2 text-center justify-center pt-1">
              <Heart className="w-4 h-4 text-pink-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">{report.motivation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
