import { useState, useCallback, useRef, useEffect } from 'react';
import TopicInput from './components/TopicInput';
import PresetSelector from './components/PresetSelector';
import TeamCompositionCard from './components/TeamComposition';
import MeetingStream from './components/MeetingStream';
import ActionPlanCard from './components/ActionPlan';
import { composeTeam, streamMeeting } from './lib/api';
import type { TeamComposition, ActionPlan, AppPhase, Preset, MeetingHistory } from './types';

const HISTORY_KEY = 'bizmind_history';
const CUSTOM_PRESETS_KEY = 'bizmind_custom_presets';
const MAX_HISTORY = 10;

function loadHistory(): MeetingHistory[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(history: MeetingHistory[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function loadCustomPresets(): Preset[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: Preset[]) {
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

function parseActionPlan(content: string): ActionPlan | null {
  const match = content.match(/---ACTION_PLAN_START---([\s\S]*?)---ACTION_PLAN_END---/);
  if (!match) return null;
  try {
    const jsonStr = match[1].trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('input');
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [contextPlaceholder, setContextPlaceholder] = useState('');
  const [team, setTeam] = useState<TeamComposition | null>(null);
  const [meetingContent, setMeetingContent] = useState('');
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<MeetingHistory[]>(loadHistory);
  const [customPresets, setCustomPresets] = useState<Preset[]>(loadCustomPresets);
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handlePresetSelect = useCallback((preset: Preset) => {
    setTopic(preset.topic);
    setContext('');
    setContextPlaceholder(preset.context_placeholder);
    setPhase('input');
    setTeam(null);
    setMeetingContent('');
    setActionPlan(null);
    setError('');
  }, []);

  const handleSavePreset = useCallback(
    (topicText: string) => {
      const label = topicText.length > 20 ? topicText.slice(0, 20) + '...' : topicText;
      const newPreset: Preset = {
        id: `custom-${Date.now()}`,
        emoji: '⭐',
        label,
        topic: topicText,
        context_placeholder: '',
      };
      const updated = [newPreset, ...customPresets];
      setCustomPresets(updated);
      saveCustomPresets(updated);
    },
    [customPresets]
  );

  const handleDeleteCustomPreset = useCallback(
    (id: string) => {
      const updated = customPresets.filter((p) => p.id !== id);
      setCustomPresets(updated);
      saveCustomPresets(updated);
    },
    [customPresets]
  );

  const handleStart = useCallback(
    async (inputTopic: string, inputContext: string) => {
      setError('');
      setPhase('composing');
      setTeam(null);
      setMeetingContent('');
      setActionPlan(null);
      setTopic(inputTopic);
      setContext(inputContext);

      try {
        // Step 1: Compose team
        const composedTeam = await composeTeam(inputTopic, inputContext);
        setTeam(composedTeam);
        setPhase('meeting');

        // Step 2: Stream meeting
        let fullContent = '';
        const controller = await streamMeeting(
          composedTeam,
          inputTopic,
          inputContext,
          (text) => {
            fullContent += text;
            setMeetingContent(fullContent);

            // Try parsing action plan as it streams
            const plan = parseActionPlan(fullContent);
            if (plan) setActionPlan(plan);
          },
          () => {
            setPhase('done');
            // Final parse
            const plan = parseActionPlan(fullContent);
            if (plan) setActionPlan(plan);

            // Save to history
            const entry: MeetingHistory = {
              id: `meeting-${Date.now()}`,
              topic: inputTopic,
              context: inputContext,
              team: composedTeam,
              meetingContent: fullContent,
              actionPlan: plan,
              createdAt: new Date().toISOString(),
            };
            const updated = [entry, ...loadHistory()].slice(0, MAX_HISTORY);
            saveHistory(updated);
            setHistory(updated);
          },
          (errMsg) => {
            setError(errMsg);
            setPhase('done');
          }
        );
        abortRef.current = controller;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        setPhase('input');
      }
    },
    []
  );

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setPhase('input');
    setTopic('');
    setContext('');
    setContextPlaceholder('');
    setTeam(null);
    setMeetingContent('');
    setActionPlan(null);
    setError('');
  }, []);

  const handleLoadHistory = useCallback((entry: MeetingHistory) => {
    setTopic(entry.topic);
    setContext(entry.context);
    setTeam(entry.team);
    setMeetingContent(entry.meetingContent);
    setActionPlan(entry.actionPlan);
    setPhase('done');
    setShowHistory(false);
    setError('');
  }, []);

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="border-b border-navy-700 bg-navy-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-xl font-bold text-slate-100 cursor-pointer"
            onClick={handleReset}
          >
            🧠 BizMind <span className="text-amber-400 text-sm font-normal ml-1">AI 전략 회의 시뮬레이터</span>
          </h1>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-1.5 rounded-lg border border-navy-700 text-slate-400
                           hover:text-amber-400 hover:border-amber-500 text-sm transition-colors"
              >
                📂 히스토리 ({history.length})
              </button>
            )}
            {phase !== 'input' && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-navy-700 text-slate-400
                           hover:text-red-400 hover:border-red-500 text-sm transition-colors"
              >
                새 회의
              </button>
            )}
          </div>
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">최근 회의 히스토리</h3>
            <div className="space-y-2">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleLoadHistory(entry)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-navy-900 border border-navy-700
                             hover:border-amber-500 transition-colors"
                >
                  <p className="text-sm text-slate-200 truncate">{entry.topic}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(entry.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {entry.team && ` — ${entry.team.industry}`}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => handleStart(topic, context)}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-sm
                         hover:bg-red-500/30 transition-colors"
            >
              재시도
            </button>
          </div>
        )}

        {/* Input Phase */}
        {phase === 'input' && (
          <>
            <PresetSelector
              onSelect={handlePresetSelect}
              customPresets={customPresets}
              onDeleteCustom={handleDeleteCustomPreset}
            />
            <TopicInput
              onSubmit={handleStart}
              isLoading={false}
              initialTopic={topic}
              initialContext={context}
              contextPlaceholder={contextPlaceholder}
              onSavePreset={handleSavePreset}
            />
          </>
        )}

        {/* Composing Phase */}
        {phase === 'composing' && (
          <>
            <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 mb-6">
              <p className="text-slate-300 text-sm">
                <span className="text-amber-400 font-medium">화두:</span> {topic}
              </p>
            </div>
            <TeamCompositionCard team={null} isLoading={true} />
            <div className="mt-6 flex justify-center">
              <div className="text-slate-400 text-sm animate-pulse">
                최적의 전문가 팀을 구성하고 있습니다...
              </div>
            </div>
          </>
        )}

        {/* Meeting / Done Phase */}
        {(phase === 'meeting' || phase === 'done') && (
          <>
            <div className="bg-navy-800 border border-navy-700 rounded-xl p-4 mb-2">
              <p className="text-slate-300 text-sm">
                <span className="text-amber-400 font-medium">화두:</span> {topic}
              </p>
            </div>
            <TeamCompositionCard team={team} isLoading={false} />
            <MeetingStream
              content={meetingContent}
              team={team}
              isStreaming={phase === 'meeting'}
            />
            <ActionPlanCard
              plan={actionPlan}
              meetingContent={meetingContent}
              topic={topic}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-700 mt-12 py-6">
        <p className="text-center text-xs text-slate-600">
          BizMind — AI 전략 회의 시뮬레이터 | Powered by Claude
        </p>
      </footer>
    </div>
  );
}
