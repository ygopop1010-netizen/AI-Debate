import { useState } from 'react';

interface Props {
  onSubmit: (topic: string, context: string) => void;
  isLoading: boolean;
  initialTopic?: string;
  initialContext?: string;
  contextPlaceholder?: string;
  onSavePreset?: (topic: string) => void;
}

export default function TopicInput({
  onSubmit,
  isLoading,
  initialTopic = '',
  initialContext = '',
  contextPlaceholder,
  onSavePreset,
}: Props) {
  const [topic, setTopic] = useState(initialTopic);
  const [context, setContext] = useState(initialContext);
  const [showContext, setShowContext] = useState(!!initialContext);

  // Sync when preset changes
  const prevTopic = useState(initialTopic)[0];
  if (initialTopic !== prevTopic) {
    setTopic(initialTopic);
    setContext(initialContext);
    setShowContext(!!initialContext);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;
    onSubmit(topic.trim(), context.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-navy-800 rounded-xl p-6 border border-navy-700">
      <label className="block text-sm font-medium text-slate-400 mb-2">
        어떤 비즈니스 화두를 던지시겠습니까?
      </label>
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="예: 서울 강남 지역에 프리미엄 한우 오마카세 레스토랑을 오픈하려고 합니다."
        className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-3 text-slate-200
                   placeholder:text-slate-600 focus:outline-none focus:border-amber-500
                   resize-none min-h-[100px]"
        rows={3}
        disabled={isLoading}
      />

      <button
        type="button"
        onClick={() => setShowContext(!showContext)}
        className="mt-3 text-sm text-slate-500 hover:text-amber-400 transition-colors"
      >
        {showContext ? '▼' : '▶'} 추가 맥락 (선택)
      </button>

      {showContext && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">
            지역/예산/목표 등 구체적 조건을 추가하면 더 정확한 전략이 나옵니다
          </p>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={contextPlaceholder || '지역, 예산, 목표, 현재 상황 등을 자유롭게 입력하세요.'}
            className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-3 text-slate-200
                       placeholder:text-slate-600 focus:outline-none focus:border-amber-500
                       resize-none min-h-[80px] text-sm"
            rows={4}
            disabled={isLoading}
          />
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={!topic.trim() || isLoading}
          className="flex-1 py-3 rounded-lg bg-amber-500 text-navy-900 font-bold text-base
                     hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? '회의 준비 중...' : '🚀 회의 시작'}
        </button>
        {onSavePreset && topic.trim() && (
          <button
            type="button"
            onClick={() => onSavePreset(topic.trim())}
            className="px-4 py-3 rounded-lg border border-navy-700 text-slate-400
                       hover:border-emerald-500 hover:text-emerald-400 transition-all text-sm"
          >
            ⭐ 프리셋 저장
          </button>
        )}
      </div>
    </form>
  );
}
