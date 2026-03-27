import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { TeamComposition } from '../types';

interface Props {
  content: string;
  team: TeamComposition | null;
  isStreaming: boolean;
}

const agentStyles: Record<string, { bg: string; border: string; text: string }> = {
  A: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  B: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  C: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
};

function parseContent(content: string, team: TeamComposition | null) {
  // Remove ACTION_PLAN block from display
  const displayContent = content.replace(
    /---ACTION_PLAN_START---[\s\S]*?(---ACTION_PLAN_END---|$)/,
    ''
  );

  // Split into STEP segments and agent messages
  const lines = displayContent.split('\n');
  const segments: Array<{ type: 'step' | 'message'; agentId?: string; content: string }> = [];
  let currentContent = '';
  let currentAgent: string | undefined;

  const flushCurrent = () => {
    if (currentContent.trim()) {
      segments.push({
        type: 'message',
        agentId: currentAgent,
        content: currentContent.trim(),
      });
    }
    currentContent = '';
    currentAgent = undefined;
  };

  for (const line of lines) {
    const stepMatch = line.match(/^\*\*\[STEP \d+:.*?\]\*\*/);
    if (stepMatch) {
      flushCurrent();
      segments.push({ type: 'step', content: line });
      continue;
    }

    const agentMatch = line.match(/^\*\*\[([ABC]):/);
    if (agentMatch) {
      flushCurrent();
      currentAgent = agentMatch[1];
      currentContent = line;
      continue;
    }

    currentContent += '\n' + line;
  }
  flushCurrent();

  return segments.map((seg, i) => {
    if (seg.type === 'step') {
      return (
        <div key={i} className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-navy-700" />
          <span className="text-amber-400 font-bold text-sm whitespace-nowrap">
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                strong: ({ children }) => <strong>{children}</strong>,
              }}
            >
              {seg.content}
            </ReactMarkdown>
          </span>
          <div className="flex-1 h-px bg-navy-700" />
        </div>
      );
    }

    const style = seg.agentId ? agentStyles[seg.agentId] : null;
    const agent = team?.agents.find((a) => a.id === seg.agentId);

    return (
      <div
        key={i}
        className={`my-3 p-4 rounded-lg border ${
          style ? `${style.bg} ${style.border}` : 'bg-navy-800 border-navy-700'
        }`}
      >
        {agent && (
          <div className={`text-xs font-bold mb-1 ${style?.text || 'text-slate-400'}`}>
            {agent.emoji} {agent.id}: {agent.title}
          </div>
        )}
        <div className="text-slate-300 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{seg.content}</ReactMarkdown>
        </div>
      </div>
    );
  });
}

export default function MeetingStream({ content, team, isStreaming }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && isStreaming) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  if (!content && !isStreaming) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
        💬 전략 회의 진행
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse rounded-sm" />
        )}
      </h3>
      <div
        ref={containerRef}
        className="bg-navy-800 border border-navy-700 rounded-xl p-6 max-h-[600px] overflow-y-auto"
      >
        {content ? (
          parseContent(content, team)
        ) : (
          <div className="text-slate-500 text-sm animate-pulse">회의를 시작하고 있습니다...</div>
        )}
      </div>
    </div>
  );
}
