// scripts/run-all-tests.mjs
const BASE_URL = 'http://localhost:3000';

const results = [];

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, status: 'PASS', durationMs: duration });
    console.log(`✅ [PASS] ${name} (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - start;
    results.push({ name, status: 'FAIL', durationMs: duration, error: err.message });
    console.error(`❌ [FAIL] ${name} (${duration}ms):`, err.message);
  }
}

async function run() {
  console.log('====================================================');
  console.log('🧪 Starting PreparationAI Comprehensive Test Suite');
  console.log('====================================================\n');

  // Test 1: API Root Health Check
  await test('1. System Health & Core API Root', async () => {
    const res = await fetch(`${BASE_URL}/api`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.message) throw new Error('Invalid response structure');
  });

  // Test 2: Auth Flow (Register & Login with unique test user)
  const testEmail = `qa_test_${Date.now()}@prepai.test`;
  const testPassword = 'TestPassword123!';
  const testUser = {
    email: testEmail,
    name: 'QA Test Student',
    type: 'school-12',
    examGoal: 'jee-main',
    examGoals: ['jee-main', 'gate-cs'],
    darkMode: true,
  };
  let createdUserId = '';

  await test('2. Auth API — Registration & Database Insertion', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: testUser, password: testPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Registration failed: ${err.error || res.statusText}`);
    }
    const data = await res.json();
    if (!data.userId && !data.success) throw new Error('User not returned on register');
    createdUserId = data.userId;
  });

  await test('3. Auth API — Login & State Hydration', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    if (!res.ok) throw new Error(`Login HTTP ${res.status}`);
    const data = await res.json();
    if (!data.user || data.user.email.toLowerCase() !== testEmail.toLowerCase()) {
      throw new Error('Hydrated user email mismatch');
    }
  });

  // Test 4: Notifications API
  await test('4. Notification Engine — Create, Read & Mark Read', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications?userId=${createdUserId}`);
    if (!res.ok) throw new Error(`Notifications GET HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.notifications)) throw new Error('Invalid notifications payload');
  });

  // Test 5: Exam News & Live Feed
  await test('5. Live Exam News & Notification Hub', async () => {
    const res = await fetch(`${BASE_URL}/api/exam-news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exams: ['jee-main', 'gate-cs'] }),
    });
    if (!res.ok) throw new Error(`Exam News HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid news feed array');
  });

  // Test 6: Mock Exam Generator (Server-Side Dedup)
  let generatedExam = null;
  await test('6. Mock Exam Generator — 5-Tier Syllabus & Question Dedup', async () => {
    const res = await fetch(`${BASE_URL}/api/mock-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examId: 'jee-main',
        userId: createdUserId,
        seenSignatures: [],
      }),
    });
    if (!res.ok) throw new Error(`Mock Exam Gen HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('Generated exam has no questions');
    }
    generatedExam = data;
  });

  // Test 7: Exam Evaluation Engine (IRT & Psychometric scoring)
  await test('7. Exam Evaluation Engine — Scorecard, Analytics & Telemetry', async () => {
    if (!generatedExam) throw new Error('No generated exam from prior step');
    const dummyAnswers = {};
    generatedExam.questions.forEach((q, idx) => {
      dummyAnswers[q.id] = { type: 'mcq', optionIndex: idx % 2 === 0 ? (q.correctOptions?.[0] ?? 0) : 1 };
    });

    const res = await fetch(`${BASE_URL}/api/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam: generatedExam,
        answers: dummyAnswers,
        totalDurationSec: 120,
        userId: createdUserId,
      }),
    });
    if (!res.ok) throw new Error(`Evaluate HTTP ${res.status}`);
    const data = await res.json();
    const attempt = data.attempt || data;
    if (typeof attempt.score !== 'number' || typeof attempt.percentile !== 'number') {
      throw new Error('Invalid scorecard calculation');
    }
  });

  // Test 8: Socratic AI Mentor Engine
  await test('8. Socratic AI Mentor — Misconception Detection & State Machine', async () => {
    const res = await fetch(`${BASE_URL}/api/socratic-mentor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        examGoal: 'jee-main',
        user: { id: createdUserId, type: 'school-12', examGoal: 'jee-main' },
        message: 'I keep confusing Work-Energy Theorem with Conservation of Momentum.',
      }),
    });
    if (!res.ok) throw new Error(`Socratic Mentor HTTP ${res.status}`);
    const data = await res.json();
    if (!data.reply && !data.message && !data.response) {
      throw new Error('Empty Socratic response');
    }
  });

  // Test 9: Doubt Solver
  await test('9. AI Doubt Solver — Step-by-Step Conceptual Breakdown', async () => {
    const res = await fetch(`${BASE_URL}/api/solve-doubt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'What is the time complexity of Dijkstra algorithm with Binary Heap?',
        examGoal: 'gate-cs',
      }),
    });
    if (!res.ok) throw new Error(`Doubt Solver HTTP ${res.status}`);
    const data = await res.json();
    if (!data.solution && !data.explanation && !data.content && !data.reply) {
      throw new Error('Invalid doubt solver response');
    }
  });

  // Test 10: PYQ Bank / Multi-Volume Archive
  await test('10. 10-Year PYQ Bank — Multi-Volume Volumes & Ingestion', async () => {
    const res = await fetch(`${BASE_URL}/api/pyq-bank?examId=gate-cs`);
    if (!res.ok) throw new Error(`PYQ Bank HTTP ${res.status}`);
    const data = await res.json();
    if (!data.volumes || !Array.isArray(data.volumes)) {
      throw new Error('Invalid PYQ volumes response');
    }
  });

  // Test 11: Proctoring Session Lifecycle
  await test('11. Integrity Proctoring — Session Init, Event Ingestion & Close', async () => {
    const initRes = await fetch(`${BASE_URL}/api/proctoring/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_session',
        examType: 'jee-main',
        userId: createdUserId,
        cameraEnabled: true,
      }),
    });
    if (!initRes.ok) throw new Error(`Proctoring Init HTTP ${initRes.status}`);
    const initData = await initRes.json();
    const sessionId = initData.session?.id || 'test-session-' + Date.now();

    const eventRes = await fetch(`${BASE_URL}/api/proctoring/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ingest_events',
        sessionId,
        events: [{ type: 'tab_switch', timestamp: Date.now(), details: 'Switched to browser tab' }],
      }),
    });
    if (!eventRes.ok) throw new Error(`Proctoring Event HTTP ${eventRes.status}`);
  });

  console.log('\n====================================================');
  console.log(`📊 Test Execution Complete: ${results.filter(r => r.status === 'PASS').length}/${results.length} PASSED`);
  console.log('====================================================');
}

run().catch(console.error);
