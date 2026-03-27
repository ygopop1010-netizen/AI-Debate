import { ActionPlan as ActionPlanType } from '../types';

interface Props {
  plan: ActionPlanType | null;
  meetingContent: string;
  topic: string;
}

function exportMarkdown(plan: ActionPlanType, meetingContent: string, topic: string) {
  let md = `# 🧠 BizMind 전략 회의록\n\n`;
  md += `## 화두\n${topic}\n\n`;
  md += `## 회의 내용\n${meetingContent.replace(/---ACTION_PLAN_START---[\s\S]*?---ACTION_PLAN_END---/, '')}\n\n`;
  md += `## 📋 최종 액션플랜: ${plan.title}\n\n`;
  md += `### 핵심 요약\n${plan.summary}\n\n`;
  md += `### 실행 항목\n`;
  md += `| 우선순위 | 실행 항목 | 담당 | 기한 | KPI |\n`;
  md += `|---------|---------|------|------|-----|\n`;
  plan.action_items.forEach((item) => {
    md += `| ${item.priority} | ${item.task} | ${item.owner} | ${item.timeline} | ${item.kpi} |\n`;
  });
  md += `\n### 리스크\n`;
  plan.risks.forEach((r) => (md += `- ${r}\n`));
  md += `\n### 기대 효과\n${plan.expected_outcome}\n`;
  return md;
}

export default function ActionPlanCard({ plan, meetingContent, topic }: Props) {
  if (!plan) return null;

  const handleCopy = async () => {
    const md = exportMarkdown(plan, meetingContent, topic);
    await navigator.clipboard.writeText(md);
    alert('클립보드에 복사되었습니다!');
  };

  const handleDownload = () => {
    const md = exportMarkdown(plan, meetingContent, topic);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bizmind-${plan.title.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 bg-navy-800 border border-amber-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-amber-400">📋 최종 액션플랜</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-navy-700 text-slate-300 hover:text-amber-400
                       text-sm transition-colors border border-navy-600"
          >
            📋 복사
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-navy-700 text-slate-300 hover:text-amber-400
                       text-sm transition-colors border border-navy-600"
          >
            📄 마크다운 다운로드
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-100 mb-3">{plan.title}</h2>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
        <p className="text-amber-200 text-sm whitespace-pre-line">{plan.summary}</p>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              <th className="text-left py-2 px-3 text-slate-400 font-medium">우선순위</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">실행 항목</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">담당</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">기한</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">KPI</th>
            </tr>
          </thead>
          <tbody>
            {plan.action_items.map((item, i) => (
              <tr key={i} className="border-b border-navy-700/50">
                <td className="py-2 px-3">
                  <span className="inline-block w-6 h-6 rounded-full bg-amber-500 text-navy-900
                                   text-xs font-bold flex items-center justify-center">
                    {item.priority}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-300">{item.task}</td>
                <td className="py-2 px-3 text-slate-400">{item.owner}</td>
                <td className="py-2 px-3 text-slate-400">{item.timeline}</td>
                <td className="py-2 px-3 text-slate-400">{item.kpi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-slate-500">리스크:</span>
        {plan.risks.map((risk, i) => (
          <span
            key={i}
            className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20"
          >
            {risk}
          </span>
        ))}
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
        <p className="text-emerald-300 text-sm">
          <strong>기대 효과:</strong> {plan.expected_outcome}
        </p>
      </div>
    </div>
  );
}
