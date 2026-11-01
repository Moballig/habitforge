'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Heart, RefreshCw, Check, ArrowRight } from 'lucide-react';

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
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-hi to-primary flex items-center justify-center clay-sm">
            <Sparkles className="w-5 h-5 text-on-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground">AI Weekly Report</h3>
            <p className="text-xs text-muted-fg">Personalized analysis of your week</p>
          </div>
        </div>
        <button onClick={generate} disabled={loading} className="btn btn-primary px-4 py-2.5 text-sm">
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              Analyzing...
            </>
          ) : report ? (
            <>
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
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
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm text-muted-fg">
              Reading your habit data and writing your report...
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-100/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Report unavailable
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!report && !loading && !error && (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 clay-sm">
              <Sparkles className="w-7 h-7 text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-foreground mb-1">
              See how your week went
            </p>
            <p className="text-xs text-muted-fg max-w-sm mx-auto">
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
                  background: `conic-gradient(${scoreColor} ${report.overallScore * 3.6}deg, var(--muted) 0deg)`,
                }}
                role="img"
                aria-label={`Overall score ${report.overallScore} out of 100`}
              >
                <div className="absolute inset-2 bg-card rounded-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-heading font-bold text-foreground">
                    {report.overallScore}
                  </span>
                  <span className="text-[10px] text-muted-fg">score</span>
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed flex-1">
                {report.summary}
              </p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                    Strengths
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-emerald-800 dark:text-emerald-300 flex gap-1.5">
                      <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-500" aria-hidden="true" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-amber-100/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Focus Areas
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {report.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tip */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                  Tip for next week
                </p>
                <p className="text-sm text-foreground">{report.tip}</p>
              </div>
            </div>

            {/* Motivation */}
            <div className="flex items-center gap-2 text-center justify-center pt-1">
              <Heart className="w-4 h-4 text-rose-500" aria-hidden="true" />
              <p className="text-sm text-muted-fg italic">{report.motivation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
