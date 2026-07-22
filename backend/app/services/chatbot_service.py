import os
import re
from dotenv import load_dotenv
from openai import OpenAI
from app.prompts.counseling_prompt import SYSTEM_PROMPT

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


PROFILE_CONFLICT_ANSWER = (
    "처음 입력한 정보와 지금 질문에 포함된 정보가 서로 달라 보여요.\n\n"
    "현재 상담은 처음 선택한 프로필 정보를 기준으로 이어지고 있어서, "
    "다른 나이·원인·시술 단계로 상담을 받고 싶다면 홈페이지를 새로고침한 뒤 "
    "정보를 다시 입력해 주세요."
)

SUPPORT_GUIDE_URL = "https://www.e-health.go.kr/gh/caSrvcGud/selectMdclSupGudInfo.do?heBiz=PG00001&menuId=200009"

SUPPORT_GUIDE_TEXT = f"""
💳 **시술비 지원도 함께 확인해보세요**
- e보건소에는 **난임부부 시술비 지원** 안내가 있어요.
- 지원범위에는 **체외수정(신선배아·동결배아)**, **인공수정** 시술비 중 일부와 전액본인부담금이 포함될 수 있습니다.
- 비급여 항목 중 **배아동결비**, **유산방지제**, **착상보조제**도 지원 범위에 포함될 수 있어요.
- 지원은 보통 **지원결정통지서 발급 이후 발생한 비용**을 기준으로 하므로, 시술 전에 관할 보건소나 e보건소에서 먼저 확인하는 것이 좋아요.

🔗 e보건소 난임부부 시술비 지원: {SUPPORT_GUIDE_URL}
""".strip()

PROFILE_OPTION_GROUPS = {
    "infertility_cause": [
        "남성요인",
        "배란기능장애",
        "난소기능저하",
        "난관요인",
        "자궁요인",
        "자궁내막증",
        "원인불명",
        "기타요인",
        "복합요인",
    ],
    "treatment_interest": [
        "인공수정",
        "체외수정",
        "신선배아",
        "동결배아",
    ],
    "current_stage": [
        "첫 상담 전",
        "검사 진행 중",
        "시술 상담 예정",
        "1차 시술 예정",
        "반복 시술 중",
    ],
}

SUPPORT_QUESTION_KEYWORDS = [
    "지원금",
    "지원",
    "정부",
    "보조금",
    "시술비",
    "비용",
    "돈",
    "얼마",
    "본인부담",
    "비급여",
    "배아동결",
    "유산방지제",
    "착상보조제",
    "보건소",
    "e보건소",
]


def _age_group_bounds(age_group: str | None) -> tuple[int | None, int | None] | None:
    if not age_group:
        return None

    numbers = [int(value) for value in re.findall(r"\d+", age_group)]
    if len(numbers) >= 2:
        return numbers[0], numbers[1]
    if len(numbers) == 1:
        if "미만" in age_group:
            return None, numbers[0] - 1
        if "이상" in age_group:
            return numbers[0], None

    return None


def _message_age(message: str) -> int | None:
    match = re.search(r"(\d{1,2})\s*세", message)
    if match:
        return int(match.group(1))
    return None


def has_profile_conflict(message: str, profile: dict) -> bool:
    age = _message_age(message)
    bounds = _age_group_bounds(profile.get("age_group"))
    if age is not None and bounds is not None:
        lower, upper = bounds
        if lower is not None and age < lower:
            return True
        if upper is not None and age > upper:
            return True

    for field, options in PROFILE_OPTION_GROUPS.items():
        current_value = profile.get(field)
        if not current_value:
            continue

        for option in options:
            if option in message and option != current_value:
                return True

    return False


def is_support_question(message: str) -> bool:
    return any(keyword in message for keyword in SUPPORT_QUESTION_KEYWORDS)


def _format_conversation_history(history: list[dict] | None) -> str:
    if not history:
        return "이전 대화 없음"

    lines: list[str] = []
    for message in history[-8:]:
        if not isinstance(message, dict):
            continue

        role = message.get("role")
        content = re.sub(r"\s+", " ", str(message.get("content") or "")).strip()
        if not content or role not in {"user", "assistant"}:
            continue

        speaker = "사용자" if role == "user" else "상담봇"
        lines.append(f"{speaker}: {content[:450]}")

    return "\n".join(lines) if lines else "이전 대화 없음"


def _has_prior_support_answer(history: list[dict] | None) -> bool:
    if not history:
        return False

    target_keywords = ["e보건소", SUPPORT_GUIDE_URL, "시술비 지원", "지원결정통지서"]
    return any(
        isinstance(message, dict)
        and message.get("role") == "assistant"
        and any(keyword in str(message.get("content") or "") for keyword in target_keywords)
        for message in history
    )


def _is_follow_up(history: list[dict] | None) -> bool:
    if not history:
        return False

    user_turns = sum(
        1
        for message in history
        if isinstance(message, dict) and message.get("role") == "user"
    )
    assistant_turns = sum(
        1
        for message in history
        if isinstance(message, dict) and message.get("role") == "assistant"
    )
    return user_turns >= 2 and assistant_turns >= 1


def build_context_from_stats(profile: dict, stats: dict | None = None) -> str:
    context = f"""
사용자 정보:
- 연령대: {profile.get("age_group")}
- 난임 원인: {profile.get("infertility_cause")}
- 관심 시술: {profile.get("treatment_interest")}
- 현재 단계: {profile.get("current_stage")}
"""

    if stats:
        context += f"""

조회된 공공데이터 요약:
{stats}
"""

    return context


def generate_fallback_answer(
    message: str,
    profile: dict,
    stats: dict | None = None,
    conversation_history: list[dict] | None = None,
) -> str:
    if _is_follow_up(conversation_history):
        answer = (
            "좋아요, 그 부분만 이어서 보면 됩니다. 앞에서 말씀드린 기본 정보는 다시 반복하지 않고, 이번 질문은 병원에 가져갈 확인 질문으로 좁혀보면 좋아요.\n\n"
            f"이번 질문: {message}\n\n"
            "진료실에서는 “제 상황에서 이 선택지가 왜 필요한지”, “지금 단계에서 바로 결정해야 하는지”, “다음 방문 전 준비할 검사나 서류가 있는지”를 물어보면 대화가 훨씬 구체적해집니다."
        )

        if is_support_question(message) and not _has_prior_support_answer(conversation_history):
            answer = f"{answer}\n\n{SUPPORT_GUIDE_TEXT}"

        return answer

    age = profile.get("age_group") or "선택한 연령대"
    cause = profile.get("infertility_cause") or "선택한 난임 원인"
    treatment = profile.get("treatment_interest") or "관심 시술"

    answer = f"""
📌 **현재 기준 정보**
- 연령대: **{age}**
- 난임 원인: **{cause}**
- 관심 시술: **{treatment}**

📊 **통계 확인**
오른쪽 카드에서 연령대·원인별 시술 현황, 시술 과정별 현황, 시술 차수별 현황을 확인할 수 있어요.
이 통계는 같은 조건의 전반적인 현황을 이해하기 위한 **참고자료**이며, 개인에게 어떤 시술이 적합한지 판단하는 기준은 아닙니다.

📝 **병원 상담 때 물어볼 질문**

1. 제 연령대와 난임 원인을 고려했을 때 상담 시 논의할 수 있는 시술 선택지는 무엇인가요?
2. 인공수정, 신선배아, 동결배아 중 어떤 방식이 제 상황에서 검토될 수 있나요?
3. 시술 전 추가로 필요한 검사는 무엇인가요?
4. 시술이 중단되거나 다음 단계로 넘어가는 기준은 무엇인가요?
5. 다음 방문 전 준비해야 할 검사, 서류, 생활 관리 항목은 무엇인가요?

⚠️ **안내**
이 정보는 공공데이터 기반 참고자료이며, 개인의 진단이나 치료방침을 결정하지 않습니다.
정확한 판단은 **난임 전문 의료진**과 상담하세요.
""".strip()

    if is_support_question(message) and not _has_prior_support_answer(conversation_history):
        answer = f"{answer}\n\n{SUPPORT_GUIDE_TEXT}"

    return answer


def generate_chat_answer(
    message: str,
    profile: dict,
    stats: dict | None = None,
    conversation_history: list[dict] | None = None,
) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return generate_fallback_answer(message, profile, stats, conversation_history)

    context = build_context_from_stats(profile, stats)
    should_include_support = is_support_question(message) and not _has_prior_support_answer(conversation_history)
    support_context = f"\n\n지원금 관련 참고 정보:\n{SUPPORT_GUIDE_TEXT}" if should_include_support else ""
    repetition_instruction = """
반복 방지:
- 이전 대화에서 이미 설명한 프로필, 통계 요약, 안전 안내, 지원금 링크는 다시 길게 반복하지 마세요.
- 사용자가 추가 질문을 하면 그 질문에만 이어서 답하고, 필요한 경우 “앞에서 말한 내용은 유지하고” 정도로 짧게 연결하세요.
- 같은 병원 상담 질문 목록을 매번 다시 만들지 마세요. 새 질문이 있으면 이전 목록에 추가할 질문만 2~4개 제안하세요.
- 안전 문구는 답변 끝마다 반복하지 말고, 위험하거나 의학적 판단이 필요한 질문일 때만 짧게 말하세요.
""".strip()

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "system",
                    "content": repetition_instruction,
                },
                {
                    "role": "user",
                    "content": f"""
{context}
{support_context}

이전 대화:
{_format_conversation_history(conversation_history)}

사용자 질문:
{message}

위 정보를 바탕으로 상담 준비용 답변을 작성하세요.
이전 대화에서 이미 말한 내용은 다시 설명하지 말고, 이번 질문에 필요한 새 정보만 답하세요.
필요하면 **굵게 표시**를 조금만 사용해 핵심을 보기 좋게 정리하세요.
사용자가 비용, 지원금, 보건소, 배아동결비, 유산방지제, 착상보조제, 체외수정 또는 인공수정 시술비 지원을 물어보고 이전 대화에서 아직 안내하지 않았을 때만 e보건소 난임부부 시술비 지원 사이트를 안내하세요.
"""
                }
            ],
            temperature=0.45,
        )
    except Exception:
        return generate_fallback_answer(message, profile, stats, conversation_history)

    return response.choices[0].message.content
