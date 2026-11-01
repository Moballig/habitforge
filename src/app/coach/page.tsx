'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Lightbulb, Plus, Flame } from 'lucide-react';
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
        <div
          className="lg:col-span-2 flex flex-col card overflow-hidden"
          style={{ height: 'calc(100vh - 140px)' }}
        >
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/40">
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center clay-sm">
              <Bot className="w-5 h-5 text-on-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-foreground">AI Coach</h2>
              <p className="text-xs text-muted-fg">Powered by Gemini AI · Real-time via Convex</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 clay-sm">
                  <Sparkles className="w-8 h-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-heading font-bold text-foreground mb-2">
                  Your AI Habit Coach
                </h3>
                <p className="text-sm text-muted-fg max-w-sm mb-6">
                  Ask me anything about building habits, staying motivated, or overcoming challenges. I can see your habit data to give personalized advice.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="btn btn-soft text-left text-sm p-3 justify-start! font-medium"
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
                  <div className={`flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center clay-sm ${
                    msg.role === 'user'
                      ? 'bg-muted text-muted-fg'
                      : 'bg-primary text-on-primary'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Bot className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-on-primary rounded-br-md clay-sm'
                      : 'bg-muted text-foreground rounded-bl-md clay-inset'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-9 h-9 bg-primary rounded-2xl flex items-center justify-center clay-sm">
                  <Bot className="w-4 h-4 text-on-primary" aria-hidden="true" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 clay-inset">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-end gap-2">
              <label htmlFor="coach-input" className="sr-only">Message your AI coach</label>
              <textarea
                id="coach-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI coach anything..."
                rows={1}
                className="input resize-none text-sm"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="btn btn-primary p-3"
              >
                <Send className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Suggestions Sidebar */}
        <div className="space-y-6">
          {/* Goal-based Suggestions */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary" aria-hidden="true" />
              <h3 className="font-heading font-bold text-foreground">AI Habit Suggestions</h3>
            </div>
            <p className="text-sm text-muted-fg mb-4">
              Tell me your goal and I&apos;ll suggest habits to help you get there.
            </p>
            <div className="flex gap-2 mb-4">
              <label htmlFor="goal-input" className="sr-only">Your goal</label>
              <input
                id="goal-input"
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getSuggestions()}
                placeholder="e.g., Be more productive"
                className="input text-sm flex-1"
              />
              <button
                onClick={getSuggestions}
                disabled={!goalInput.trim() || isLoadingSuggestions}
                className="btn btn-primary px-4 py-2.5 text-sm"
              >
                {isLoadingSuggestions ? '...' : 'Go'}
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-3 rounded-2xl bg-muted clay-inset"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_CONFIG[(s.category as HabitCategory) || 'other']?.color ||
                              '#6B7280',
                          }}
                          aria-hidden="true"
                        />
                        <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                      </div>
                      <p className="text-xs text-muted-fg mt-0.5">{s.description}</p>
                    </div>
                    <button
                      onClick={() => addSuggestedHabit(s)}
                      className="btn btn-soft flex-shrink-0 p-1.5 rounded-xl! text-primary"
                      title="Add this habit"
                      aria-label={`Add ${s.name} to your habits`}
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current habits summary */}
          <div className="card p-5">
            <h3 className="font-heading font-bold text-foreground mb-3">Your Habits</h3>
            {habits.length === 0 ? (
              <p className="text-sm text-muted-fg">No habits yet. Add some to get personalized coaching!</p>
            ) : (
              <div className="space-y-2">
                {habits.slice(0, 5).map((h) => (
                  <div key={h._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${h.todayCompleted ? 'bg-primary' : 'bg-muted-fg/40'}`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-foreground truncate">{h.name}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-primary flex-shrink-0">
                      <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                      {h.currentStreak}d
                    </span>
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
