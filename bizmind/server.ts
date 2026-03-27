import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env 파일을 여러 경로에서 찾기
const envPaths = [
  path.resolve(__dirname, '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'bizmind', '.env'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`✅ .env 파일 발견: ${envPath}`);

    // Windows 메모장 UTF-16 인코딩 대응: 직접 파일을 읽어서 파싱
    let rawContent = fs.readFileSync(envPath);

    // BOM(Byte Order Mark) 제거 및 UTF-16 → UTF-8 변환
    let content: string;
    if (rawContent[0] === 0xff && rawContent[1] === 0xfe) {
      // UTF-16 LE
      content = rawContent.toString('utf16le').slice(1);
    } else if (rawContent[0] === 0xfe && rawContent[1] === 0xff) {
      // UTF-16 BE
      content = rawContent.swap16().toString('utf16le').slice(1);
    } else if (rawContent[0] === 0xef && rawContent[1] === 0xbb && rawContent[2] === 0xbf) {
      // UTF-8 BOM
      content = rawContent.toString('utf8').slice(1);
    } else {
      content = rawContent.toString('utf8');
    }

    // 직접 환경변수 파싱
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          process.env[key] = value;
          console.log(`   ${key} = ${value.slice(0, 10)}...`);
        }
      }
    }

    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error('❌ .env 파일을 찾을 수 없습니다. 찾아본 경로:');
  envPaths.forEach((p) => console.error(`   - ${p}`));
}

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey || apiKey === 'sk-ant-xxxxx') {
  console.error('');
  console.error('❌ ANTHROPIC_API_KEY가 설정되지 않았습니다!');
  console.error('');
  console.error('해결 방법: bizmind 폴더 안에 .env 파일을 만들고 아래 내용을 넣으세요:');
  console.error('ANTHROPIC_API_KEY=sk-ant-api03-여기에본인키');
  console.error('');
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
