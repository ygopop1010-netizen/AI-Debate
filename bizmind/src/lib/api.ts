import { TeamComposition } from '../types';
import { TEAM_COMPOSITION_SYSTEM_PROMPT, buildMeetingSystemPrompt } from './prompts';

export async function composeTeam(
  topic: string,
  context: string
): Promise<TeamComposition> {
  const res = await fetch('/api/compose-team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      context,
      systemPrompt: TEAM_COMPOSITION_SYSTEM_PROMPT,
    }),
  });

  if (!res.ok) {
    let errorMsg = '팀 구성에 실패했습니다.';
    try {
      const err = await res.json();
      errorMsg = err.error || errorMsg;
    } catch {
      errorMsg = `서버 오류 (${res.status}): ${await res.text().catch(() => '응답 없음')}`;
    }
    throw new Error(errorMsg);
  }

  const text = await res.text();
  if (!text) {
    throw new Error('서버에서 빈 응답이 돌아왔습니다.');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('서버 응답을 파싱할 수 없습니다: ' + text.slice(0, 200));
  }
}

export async function streamMeeting(
  team: TeamComposition,
  topic: string,
  context: string,
  onText: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<AbortController> {
  const controller = new AbortController();
  const systemPrompt = buildMeetingSystemPrompt(team, topic, context);

  try {
    const res = await fetch('/api/run-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, topic }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let errorMsg = '회의 시작에 실패했습니다.';
      try {
        const err = await res.json();
        errorMsg = err.error || errorMsg;
      } catch {
        errorMsg = `서버 오류 (${res.status}): ${await res.text().catch(() => '응답 없음')}`;
      }
      onError(errorMsg);
      return controller;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError('스트리밍을 시작할 수 없습니다.');
      return controller;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const processStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text') {
                onText(data.content);
              } else if (data.type === 'done') {
                onDone();
                return;
              } else if (data.type === 'error') {
                onError(data.content);
                return;
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
      onDone();
    };

    processStream().catch((err) => {
      if (err.name !== 'AbortError') {
        onError('스트리밍 중 오류가 발생했습니다.');
      }
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name !== 'AbortError') {
      onError('회의 시작에 실패했습니다.');
    }
  }

  return controller;
}
