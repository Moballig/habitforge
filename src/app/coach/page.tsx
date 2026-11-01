'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Lightbulb, Plus } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useHabits } from '@/hooks/useHabits';
import { HabitCategory, CATEGORY_CONFIG, AIMessage } from '@/lib/types';
import { useToast } from '@/components/Toast';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function CoachPage() {
  const { habits, addHabit } = useHabits();
  const { toast } = useToast();
  const chatAction = useAction(api.ai.chat);
  const suggestAction = useAction(api.ai.suggest);

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; description: string; category: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await chatAction({
        message: messageText,
        habitData: {
          habits: habits.map(h => ({
            name: h.name,
            category: h.category,
            currentStreak: h.currentStreak,
            completionRate: h.completionRate,
            todayCompleted: h.todayCompleted,
          })),
          totalHabits: habits.length,
          completedToday: habits.filter(h => h.todayCompleted).length,
        },
      });

      const assistantMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response || data.error || 'Sorry, I could not process that.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure your Gemini API key is configured correctly.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = async () => {
    if (!goalInput.trim() || isLoadingSuggestions) return;
    setIsLoadingSuggestions(true);

    try {
      const data = await suggestAction({
        goal: goalInput,
        existingHabits: habits.map(h => ({ name: h.name })),
      });

      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const addSuggestedHabit = (suggestion: { name: string; description: string; category: string }) => {
    addHabit({
      name: suggestion.name,
      description: suggestion.description,
      category: (suggestion.category as HabitCategory) || 'other',
      color: CATEGORY_CONFIG[(suggestion.category as HabitCategory) || 'other']?.color || '#6B7280',
      frequency: 'daily',
    });
    toast(`Added "${suggestion.name}" to your habits`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "How can I stay more consistent with my habits?",
    "I'm struggling to wake up early. Help!",
    "What habits should I build as a student?",
    "How do I recover from a broken streak?",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">AI Coach</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini AI · Real-time via Convex</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Your AI Habit Coach
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                  Ask me anything about building habits, staying motivated, or overcoming challenges. I can see your habit data to give personalized advice.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-sm p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-indigo-100 dark:bg-indigo-950'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI coach anything..."
                rows={1}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Suggestions Sidebar */}
        <div className="space-y-6">
          {/* Goal-based Suggestions */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Habit Suggestions</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Tell me your goal and I&apos;ll suggest habits to help you get there.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getSuggestions()}
                placeholder="e.g., Be more productive"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <button
                onClick={getSuggestions}
                disabled={!goalInput.trim() || isLoadingSuggestions}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-medium rounded-xl hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-sm transition-all shadow-md"
              >
                {isLoadingSuggestions ? '...' : 'Go'}
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_CONFIG[(s.category as HabitCategory) || 'other']?.color ||
                              '#6B7280',
                          }}
                          aria-hidden="true"
                        />
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.description}</p>
                    </div>
                    <button
                      onClick={() => addSuggestedHabit(s)}
                      className="flex-shrink-0 p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                      title="Add this habit"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current habits summary */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Habits</h3>
            {habits.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No habits yet. Add some to get personalized coaching!</p>
            ) : (
              <div className="space-y-2">
                {habits.slice(0, 5).map((h) => (
                  <div key={h._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${h.todayCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{h.name}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{h.currentStreak}🔥</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
