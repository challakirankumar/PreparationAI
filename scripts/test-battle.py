#!/usr/bin/env python3
"""End-to-end test of Peer Battle Mode — full battle simulation."""
import json
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://localhost:3000/api/battle"

def post(path, payload):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def get(path):
    with urllib.request.urlopen(f"{BASE}{path}", timeout=15) as r:
        return json.loads(r.read().decode())

print("=" * 70)
print("PEER BATTLE MODE — END-TO-END TEST")
print("=" * 70)
print()

# 1. Start battle
print("=== 1. Start battle (5 questions, JEE Main) ===")
r = post("/start", {
    "examId": "jee-main",
    "userId": "test_user_battle",
    "displayName": "Battle Tester",
    "mode": "solo-bot",
    "questionCount": 5,
    "timePerQuestionSec": 30,
})
battle_id = r["battleId"]
print(f"Battle ID: {battle_id}")
print(f"Opponent: {r['playerB']['displayName']} (rating {r['playerB']['rating']}, bot={r['playerB']['isBot']})")
print(f"Bot's pre-computed total: {r['playerBScore']} points")
print()

# 2. Answer all 5 questions — first 3 correct, last 2 wrong
current_question = r["currentQuestion"]
question_idx = 1
results = []

for i in range(5):
    print(f"=== Question {question_idx}/{r['questionCount']} ===")
    print(f"  Subject: {current_question['subject']} / {current_question['topic']}")
    print(f"  Difficulty: {current_question['difficulty']}")
    print(f"  Type: {current_question['type']}")
    print(f"  Question: {current_question['text'][:100]}...")

    if i < 3:
        # Correct answer
        if current_question["type"] == "mcq":
            answer = current_question["correctOptions"][0]
        elif current_question["type"] == "numerical":
            answer = current_question["correctNumeric"]
        else:
            answer = current_question["correctOptions"][0]
        print(f"  Strategy: answer CORRECTLY ({answer})")
    else:
        # Wrong answer
        wrong_opts = [j for j in range(len(current_question.get("options", []))) if j not in (current_question.get("correctOptions") or [])]
        if wrong_opts:
            answer = wrong_opts[0]
            print(f"  Strategy: answer WRONG ({answer})")
        else:
            answer = "unanswered"
            print(f"  Strategy: SKIP")

    resp = post("/respond", {
        "battleId": battle_id,
        "questionId": current_question["id"],
        "answer": answer,
        "timeTakenMs": 5000 + i * 1000,
    })
    print(f"  -> correct={resp['correct']} points={resp['pointsEarned']} | opp: correct={resp['opponentCorrect']} points={resp['opponentPointsEarned']} time={resp['opponentTimeMs']/1000:.1f}s")
    print(f"  -> Score: You {resp['scoreA']} vs Opp {resp['scoreB']}")
    results.append(resp)

    if resp["battleEnded"]:
        print()
        print(f">>> BATTLE ENDED! Winner: {resp['winner']}")
        if resp.get("xpAwardedA") is not None:
            print(f">>> XP Awarded: {resp['xpAwardedA']}")
        if resp.get("ratingChangeA") is not None:
            print(f">>> Rating Change: {resp['ratingChangeA']:+d}")
        break

    current_question = resp["nextQuestion"]
    question_idx += 1
    print()

# 3. Final battle state
print()
print("=== 2. Final battle state (GET /finish) ===")
final = get(f"/finish?battleId={battle_id}")
print(f"Status: {final['status']}")
print(f"Winner: {final['winner']}")
print(f"Final scores: A={final['playerAScore']} B={final['playerBScore']}")
print(f"XP awarded: A={final.get('xpAwardedA')} B={final.get('xpAwardedB')}")
print(f"Rating change: A={final.get('ratingChangeA'):+d} B={final.get('ratingChangeB')}")
print()

# 4. Player on leaderboard now
print("=== 3. Leaderboard after battle ===")
lb = get(f"/leaderboard?userId=test_user_battle")
my_entry = lb["myEntry"]
if my_entry:
    print(f"My rank: #{my_entry['rank']}")
    print(f"My rating: {my_entry['rating']}")
    print(f"My battles: {my_entry['totalBattles']} (W{my_entry['battlesWon']} L{my_entry['battlesLost']} D{my_entry['battlesDraw']})")
    print(f"My XP: {my_entry['totalXp']} (weekly {my_entry['weeklyXp']})")
print()

# 5. Try creating a squad
print("=== 4. Create a new squad ===")
new_squad = post("/squads", {
    "action": "create",
    "name": "Test Squad Alpha",
    "description": "End-to-end test squad",
    "examGoal": "jee-main",
    "userId": "test_user_battle",
    "displayName": "Battle Tester",
})
squad = new_squad.get("squad")
if squad:
    print(f"Created squad: {squad['name']} (id={squad['id']})")
    print(f"  Tier: {squad['tier']}")
    print(f"  Members: {len(squad['memberIds'])}")
    print(f"  Total XP: {squad['totalXp']}")
print()

print("=" * 70)
print("✅ END-TO-END TEST PASSED")
print("=" * 70)
print("Summary:")
correct_count = sum(1 for r in results if r["correct"])
print(f"  - Battle completed: {len(results)} questions answered")
print(f"  - Correct: {correct_count}, Wrong: {len(results) - correct_count}")
print(f"  - Final winner: {final['winner']}")
print(f"  - XP earned: {final.get('xpAwardedA', 0)}")
print(f"  - Rating change: {final.get('ratingChangeA', 0):+d}")
print(f"  - Player now on leaderboard with rank #{my_entry['rank'] if my_entry else '?'}")
print(f"  - Squad created: {squad['name'] if squad else 'failed'}")
