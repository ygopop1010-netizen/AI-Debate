import { TeamComposition as TeamType } from '../types';

interface Props {
  team: TeamType | null;
  isLoading: boolean;
}

const agentColors: Record<string, string> = {
  A: 'border-blue-500 bg-blue-500/10',
  B: 'border-emerald-500 bg-emerald-500/10',
  C: 'border-amber-500 bg-amber-500/10',
};

const agentLabelColors: Record<string, string> = {
  A: 'text-blue-400',
  B: 'text-emerald-400',
  C: 'text-amber-400',
};

export default function TeamCompositionCard({ team, isLoading }: Props) {
  if (!team && !isLoading) return null;

  return (
    <div className="mt-6">
      {team && (
        <div className="mb-3">
          <p className="text-sm text-slate-400">
            <span className="text-amber-400 font-medium">{team.industry}</span> — {team.topic_analysis}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading
          ? [0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-navy-800 border border-navy-700 rounded-xl p-5 animate-pulse"
              >
                <div className="h-8 w-8 bg-navy-700 rounded-full mb-3" />
                <div className="h-4 bg-navy-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-navy-700 rounded w-full mb-1" />
                <div className="h-3 bg-navy-700 rounded w-5/6" />
              </div>
            ))
          : team?.agents.map((agent) => (
              <div
                key={agent.id}
                className={`bg-navy-800 border rounded-xl p-5 ${agentColors[agent.id]}`}
              >
                <div className="text-2xl mb-2">{agent.emoji}</div>
                <h4 className={`font-bold text-base ${agentLabelColors[agent.id]}`}>
                  {agent.id}: {agent.title}
                </h4>
                <p className="text-sm text-slate-400 mt-1">{agent.expertise}</p>
                <p className="text-xs text-slate-500 mt-2 italic">
                  역할: {agent.role_in_meeting}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
}
