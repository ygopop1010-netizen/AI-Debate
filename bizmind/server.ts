import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey || apiKey === 'sk-ant-xxxxx') {
  console.error('❌ ANTHROPIC_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });

const MODEL = 'claude-sonnet-4-20250514';

// 팀 구성 API
app.post('/api/compose-team', async (req, res) => {
  try {
    const { topic, context } = req.body;
    if (!topic) {
      res.status(400).json({ error: '화두를 입력해주세요.' });
      return;
    }

    const userMessage = context
      ? `주제: ${topic}\n추가 맥락: ${context}`
      : `주제: ${topic}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: req.body.systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // JSON 파싱 시도
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: '팀 구성 응답을 파싱할 수 없습니다.' });
      return;
    }

    const team = JSON.parse(jsonMatch[0]);
    res.json(team);
  } catch (error: unknown) {
    console.error('❌ Team composition error:', error);
    const message =
      error instanceof Error ? error.message : 'API 호출 중 오류가 발생했습니다.';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});

// 회의 시뮬레이션 API (SSE 스트리밍)
app.post('/api/run-meeting', async (req, res) => {
  try {
    const { systemPrompt, topic } = req.body;
    if (!systemPrompt || !topic) {
      res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `다음 화두로 전략 회의를 시작해주세요: ${topic}`,
        },
      ],
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
    });

    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(
        `data: ${JSON.stringify({ type: 'error', content: '스트리밍 중 오류가 발생했습니다.' })}\n\n`
      );
      res.end();
    });

    req.on('close', () => {
      stream.abort();
    });
  } catch (error: unknown) {
    console.error('Meeting error:', error);
    const message =
      error instanceof Error ? error.message : 'API 호출 중 오류가 발생했습니다.';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🧠 BizMind 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
