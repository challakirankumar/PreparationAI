#!/usr/bin/env python3
"""End-to-end test of the adaptive mock engine."""
import json
import urllib.request

BASE = "http://localhost:3000/api/adaptive-exam"

def post(path, payload):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())

print("=== Starting adaptive session (JEE Main) ===")
resp = post("/start", {"examId": "jee-main", "userId": "test_user_001"})
session_id = resp["sessionId"]
print(f"session_id: {session_id}")
print(f"pool_size: {resp['totalPoolSize']}")
print(f"first_question.subject: {resp['question']['subject']}")
print(f"first_question.topic: {resp['question']['topic']}")
print(f"first_irt.b: {resp['irtItem']['b']:.3f}")
print()

current_question = resp["question"]

# Simulate 10 responses: 6 correct, then 3 wrong, then 1 unanswered
sim_pattern = [
    ("correct", 30), ("correct", 25), ("correct", 40), ("correct", 35),
    ("correct", 28), ("correct", 32), ("wrong", 15), ("wrong", 20),
    ("wrong", 18), ("unanswered", 60),
]

for i, (action, time_taken) in enumerate(sim_pattern, 1):
    q = current_question
    if not q:
        print(f"[{i}] No more questions - session terminated early")
        break

    if action == "correct":
        if q["type"] in ("mcq", "reading", "listening") and q.get("correctOptions"):
            answer = {"type": "mcq", "optionIndex": q["correctOptions"][0]}
        elif q["type"] == "msq" and q.get("correctOptions"):
            answer = {"type": "msq", "optionIndices": q["correctOptions"]}
        elif q["type"] == "numerical" and q.get("correctNumeric") is not None:
            answer = {"type": "numerical", "value": q["correctNumeric"]}
        else:
            answer = {"type": "descriptive", "text": "x" * 100}
    elif action == "wrong":
        if q["type"] in ("mcq", "reading", "listening"):
            wrong_opts = [i for i in range(len(q.get("options", []))) if i not in (q.get("correctOptions") or [])]
            answer = {"type": "mcq", "optionIndex": wrong_opts[0] if wrong_opts else 0}
        elif q["type"] == "numerical":
            answer = {"type": "numerical", "value": (q.get("correctNumeric", 0) or 0) + 999}
        else:
            answer = {"type": "descriptive", "text": "wrong"}
    else:
        answer = {"type": "unanswered"}

    print(f"[{i}] action={action:10s} subj={q['subject']:12s} topic={q['topic']:25s} diff={q['difficulty']:6s} b={resp.get('irtItem', {}).get('b', 0):.3f}")

    try:
        resp = post("/respond", {
            "sessionId": session_id,
            "questionId": q["id"],
            "answer": answer,
            "timeTakenSec": time_taken,
        })
    except Exception as e:
        print(f"  ERROR: {e}")
        break

    print(f"     -> theta={resp['currentTheta']:.3f}  SE={resp['currentSE']:.3f}  phase={resp['phase']:10s}  correct={resp['lastCorrect']}  items={resp['itemsPresented']}")

    if resp.get("terminated"):
        print(f"     -> SESSION TERMINATED: {resp.get('terminationReason')}")
        break

    current_question = resp.get("nextQuestion")

print()
print("=== Finishing session ===")
final = post("/finish", {"sessionId": session_id, "manual": True})
fs = final["finalScore"]
print(f"finalTheta: {fs['finalTheta']:.3f}")
print(f"finalSE: {fs['finalSE']:.3f}")
print(f"scorePct: {fs['scorePct']}%")
print(f"percentile: {fs['percentile']}")
print(f"totalItems: {fs['totalItems']}")
print(f"correct: {fs['correctCount']}, wrong: {fs['wrongCount']}, unattempted: {fs['unattemptedCount']}")
print(f"avgTimePerQuestionSec: {fs['avgTimePerQuestionSec']}")
print()
print("=== Theta progression ===")
for p in fs["thetaProgression"]:
    bar = "+" * int((p["theta"] + 3) * 10) if p["theta"] > -3 else ""
    correct_mark = "Y" if p["correct"] else "N"
    print(f"  Q{p['itemIndex']:2d}  theta={p['theta']:+.3f}  SE={p['se']:.3f}  {correct_mark}  {bar}")
print()
print("=== Subject breakdown ===")
for s in fs["subjectBreakdown"]:
    print(f"  {s['subject']:15s}  total={s['total']}  correct={s['correct']}  avgItemDifficulty={s['avgTheta']:+.2f}")
print()
print("=== Topic breakdown (top 5) ===")
for t in sorted(fs["topicBreakdown"], key=lambda x: -x["total"])[:5]:
    print(f"  {t['subject']:12s} | {t['topic']:25s}  total={t['total']}  correct={t['correct']}  avgB={t['avgB']:+.2f}")
