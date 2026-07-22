import os
import re
from html.parser import HTMLParser
from urllib.error import URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

LOVEPLAN_EMERGENCY_URL = "https://www.loveplan.kr/home/126.htm"

BASE_REFERENCES = [
    {
        "title": "LovePlan 응급피임 안내",
        "url": LOVEPLAN_EMERGENCY_URL,
        "summary": (
            "응급피임은 관계 후 가능한 빨리 의료진 상담을 받는 것이 중요합니다. "
            "국내 사후피임약은 의사 처방 후 약국에서 조제받는 전문의약품으로 안내합니다."
        ),
    },
    {
        "title": "상담 안전 문구",
        "url": "",
        "summary": (
            "이 답변은 임신 여부를 진단하지 않습니다. 정확한 판단, 응급피임약 처방, 복통·출혈 같은 증상 평가는 "
            "산부인과 또는 진료 가능한 의료기관에서 상담해야 합니다."
        ),
    },
]

PROFESSIONAL_REFERENCES = [
    {
        "title": "WHO Emergency contraception",
        "url": "https://www.who.int/news-room/fact-sheets/detail/emergency-contraception",
        "summary": "세계보건기구(WHO)의 응급피임 팩트시트입니다. 응급피임 방법, 시간 범위, 안전성 정보를 확인할 수 있습니다.",
    },
    {
        "title": "CDC Emergency Contraception",
        "url": "https://www.cdc.gov/contraception/hcp/usspr/emergency-contraception.html",
        "summary": "미국 CDC의 응급피임 임상 권고 자료입니다. 방법별 고려사항과 상담 포인트를 확인할 수 있습니다.",
    },
    {
        "title": "ACOG Emergency Contraception FAQ",
        "url": "https://www.acog.org/womens-health/faqs/emergency-contraception",
        "summary": "미국산부인과학회(ACOG)의 환자용 응급피임 FAQ입니다. 사후피임약과 구리 IUD 등 선택지를 설명합니다.",
    },
    {
        "title": "NHS Emergency contraception",
        "url": "https://www.nhs.uk/conditions/contraception/emergency-contraception/",
        "summary": "영국 NHS의 응급피임 안내입니다. 응급피임약, IUD, 복용 후 증상과 상담 시점을 확인할 수 있습니다.",
    },
]


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self._skip = False

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript"}:
            self._skip = True

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript"}:
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            value = re.sub(r"\s+", " ", data).strip()
            if value:
                self.parts.append(value)


def _fetch_page_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=8) as response:
        html = response.read().decode("utf-8", errors="ignore")

    parser = _TextExtractor()
    parser.feed(html)
    return " ".join(parser.parts)


def _keyword_snippets(text: str, keywords: list[str], limit: int = 4) -> list[str]:
    snippets: list[str] = []
    normalized = re.sub(r"\s+", " ", text)

    for keyword in keywords:
        position = normalized.find(keyword)
        if position == -1:
            continue

        start = max(0, position - 90)
        end = min(len(normalized), position + 180)
        snippet = normalized[start:end].strip()
        if snippet and snippet not in snippets:
            snippets.append(snippet)

        if len(snippets) >= limit:
            break

    return snippets


def _hours_since_relation(last_relation_at: str | None) -> int | None:
    if not last_relation_at:
        return None

    from datetime import datetime, timezone

    try:
        value = datetime.fromisoformat(last_relation_at.replace("Z", "+00:00"))
    except ValueError:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    elapsed = datetime.now(timezone.utc) - value.astimezone(timezone.utc)
    hours = int(elapsed.total_seconds() // 3600)
    return hours if hours >= 0 else None


def _timing_guidance(hours: int | None) -> str:
    if hours is None:
        return "마지막 관계 시점을 입력하면 경과 시간을 기준으로 상담 우선순위를 더 구체적으로 정리할 수 있습니다."
    if hours <= 24:
        return "관계 후 24시간 이내라면 가능한 빨리 산부인과 또는 진료 가능한 의료기관에 상담하는 것이 좋습니다."
    if hours <= 72:
        return "관계 후 72시간 이내 구간입니다. 지체하지 말고 의료진 상담 가능 여부를 확인하세요."
    if hours <= 120:
        return "관계 후 120시간 이내라도 약제와 개인 상황에 따라 판단이 달라질 수 있어 즉시 의료진 상담이 필요합니다."
    return "관계 후 120시간이 지난 경우 응급피임보다 임신 확인 시점과 증상 평가를 의료진과 상담하는 흐름이 중요합니다."


def _pregnancy_test_guidance(expected_period: str | None) -> str:
    if expected_period:
        return (
            f"입력한 생리 예정일은 {expected_period}입니다. 예정일이 지나도 월경이 없거나 임신 가능성이 걱정되면 "
            "임신 테스트와 진료 상담 시점을 확인하세요."
        )

    return "생리 예정일 또는 마지막 생리 시작일을 함께 입력하면 임신 테스트 시점 안내를 더 정리해볼 수 있습니다."


def _wants_professional_links(question: str, history: list[dict] | None) -> bool:
    target_text = " ".join(
        [
            question,
            *[
                str(message.get("content", ""))
                for message in (history or [])
                if isinstance(message, dict)
            ],
        ]
    ).lower()
    keywords = [
        "논문",
        "paper",
        "study",
        "journal",
        "research",
        "사이트",
        "site",
        "url",
        "link",
        "링크",
        "출처",
        "source",
        "근거",
        "해외",
        "외국",
        "전문",
    ]
    return any(keyword in target_text for keyword in keywords)


def _wants_professional_links_for_question(question: str) -> bool:
    return _wants_professional_links(question, [])


def _is_follow_up_question(payload: dict, history: list[dict] | None) -> bool:
    if payload.get("is_follow_up"):
        return True

    if not history:
        return False

    user_count = 0
    assistant_count = 0
    for message in history:
        if not isinstance(message, dict):
            continue
        if message.get("role") == "user":
            user_count += 1
        elif message.get("role") == "assistant":
            assistant_count += 1

    return user_count >= 2 and assistant_count >= 1


def _conversation_context(history: list[dict] | None) -> str:
    if not history:
        return "이전 대화 없음"

    usable_messages = [
        message
        for message in history[-6:]
        if isinstance(message, dict) and message.get("role") in {"user", "assistant"} and message.get("content")
    ]
    if not usable_messages:
        return "이전 대화 없음"

    compact_lines = []
    for message in usable_messages:
        role = "사용자" if message.get("role") == "user" else "상담봇"
        content = re.sub(r"\s+", " ", str(message.get("content"))).strip()
        compact_lines.append(f"- {role}: {content[:180]}")
    return "\n".join(compact_lines)


def _professional_links_block() -> str:
    links = "\n".join(
        f"- {reference['title']}: {reference['url']}"
        for reference in PROFESSIONAL_REFERENCES
    )
    return (
        "**전문 자료 확인**\n"
        "외국 논문이나 관련 사이트를 더 확인하고 싶다면 아래처럼 학회·공공기관 자료부터 확인하세요. "
        "개인 블로그나 판매 페이지보다 전문기관 URL을 우선 권합니다.\n"
        f"{links}"
    )


def _format_history_for_prompt(history: list[dict] | None) -> str:
    if not history:
        return "이전 대화 없음"

    lines = []
    for message in history[-8:]:
        if not isinstance(message, dict):
            continue
        role = message.get("role")
        content = re.sub(r"\s+", " ", str(message.get("content") or "")).strip()
        if not content or role not in {"user", "assistant"}:
            continue
        speaker = "사용자" if role == "user" else "상담사"
        lines.append(f"{speaker}: {content[:500]}")

    return "\n".join(lines) if lines else "이전 대화 없음"


def _build_case_context(payload: dict, hours: int | None) -> str:
    return f"""
마지막 관계 후 경과 시간: {f"{hours}시간" if hours is not None else "사용자가 아직 입력하지 않음"}
피임 여부: {payload.get("contraception") or "입력 없음"}
피임 관련 변수: {payload.get("contraception_issue") or "입력 없음"}
마지막 생리 시작일: {payload.get("last_period_start") or "입력 없음"}
생리 예정일: {payload.get("expected_period") or "입력 없음"}
현재 증상: {payload.get("symptoms") or "입력 없음"}
""".strip()


def _generate_llm_answer(payload: dict, hours: int | None, is_follow_up: bool, reference_context: str) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return None

    question = payload.get("question") or "임신 가능성과 다음 행동이 궁금합니다."
    history = payload.get("conversation_history") or []
    mode_instruction = (
        "이번 메시지는 후속질문이다. 이전 답변 형식을 반복하지 말고, 사용자의 질문 하나에만 자연스럽게 답한다."
        if is_follow_up
        else "이번 메시지는 첫 상담이다. 사용자의 상황을 짚어주되 정해진 양식처럼 보이지 않게 자연스러운 대화로 시작한다."
    )

    system_prompt = """
너는 임신 가능성, 응급피임, 임신 테스트 시점에 대해 대화하는 따뜻한 상담형 AI다.

말투:
- 한국어로 답한다.
- 실제 상담사처럼 부드럽고 자연스럽게 말한다.
- 정해진 출력 형식, 제목, 굵은 글씨, 체크리스트, 표, 번호 목록을 쓰지 않는다.
- 매번 같은 안전 문구를 반복하지 않는다.
- 사용자의 불안을 먼저 인정하되 과장해서 안심시키지 않는다.

의료 안전:
- 임신 가능성을 0% 또는 100%로 단정하지 않는다.
- 진단, 처방, 복용 지시를 하지 않는다.
- 응급피임약은 국내에서 의사 진료와 처방이 필요하다는 점을 필요한 경우 자연스럽게 말한다.
- 심한 복통, 많은 출혈, 어지럼, 실신 느낌 같은 위험 신호가 있으면 즉시 의료기관 상담을 권한다.
- 정보가 부족하면 필요한 정보 1~2개만 자연스럽게 물어본다.

답변 길이:
- 후속질문은 보통 2~5문장으로 답한다.
- 첫 상담도 길게 양식화하지 말고 짧은 단락 2~3개 정도로 답한다.
""".strip()

    user_prompt = f"""
{mode_instruction}

현재 입력된 상황:
{_build_case_context(payload, hours)}

이전 대화:
{_format_history_for_prompt(history)}

참고할 수 있는 외부 안내 자료 요약:
{reference_context or "외부 안내 자료를 불러오지 못함"}

사용자 질문:
{question}

위 내용을 바탕으로 GPT처럼 자연스럽게 답변해줘. 사용자가 링크나 논문/전문 사이트를 직접 요청한 경우가 아니라면 URL을 본문에 나열하지 마.
""".strip()

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.65,
            max_tokens=550,
        )
    except Exception:
        return None

    content = response.choices[0].message.content
    return content.strip() if content else None


def _has_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _direct_follow_up_answer(payload: dict, hours: int | None) -> str:
    question = payload.get("question") or ""
    normalized_question = re.sub(r"\s+", " ", question).strip().lower()
    contraception = payload.get("contraception") or ""
    issue = payload.get("contraception_issue") or ""
    symptoms = payload.get("symptoms") or ""

    condom_context = _has_any(
        f"{normalized_question} {contraception} {issue}",
        ["콘돔", "condom", "피임도구", "피임 도구"],
    )
    asks_possibility = _has_any(
        normalized_question,
        ["임신", "가능성", "확률", "걱정", "불안", "없지", "낮", "높"],
    )
    has_failure = _has_any(
        f"{normalized_question} {issue}",
        ["파손", "찢", "새", "빠졌", "벗겨", "질외", "누락", "실패", "확실하지"],
    )

    if condom_context and asks_possibility:
        if has_failure:
            return (
                "그 상황이면 불안하실 만해요. 콘돔을 사용했더라도 찢어짐, 빠짐, 착용 시점이 늦었던 경우처럼 변수가 있으면 임신 가능성을 0%라고 말하기는 어렵습니다. "
                "그래도 실제 위험도는 그 변수가 얼마나 분명했는지, 관계 후 시간이 얼마나 지났는지에 따라 꽤 달라져요. "
                f"{_timing_guidance(hours)} "
                "혼자 계속 확률을 계산하다 보면 더 불안해질 수 있으니, 가능하면 산부인과나 진료 가능한 의료기관에 상황을 그대로 말하고 상담받아보는 쪽이 좋겠습니다."
            )

        return (
            "그렇게 생각하고 싶어지는 마음은 정말 자연스러워요. 콘돔을 처음부터 끝까지 제대로 사용했고 찢어지거나 빠진 일이 없었다면 임신 가능성은 낮은 편으로 볼 수 있습니다. "
            "다만 피임도구가 100%를 보장하지는 않기 때문에, 의사도 아마 '절대 없다'보다는 '가능성은 낮아 보인다'는 식으로 설명할 거예요. "
            "생리 예정일이 지나도 월경이 없거나 불안이 계속 크면 임신 테스트 시점을 확인하고, 필요하면 진료 상담까지 이어가면 됩니다."
        )

    if _has_any(normalized_question, ["사후피임", "응급피임", "약", "처방", "먹어야", "복용"]):
        return (
            "사후피임약을 먹어야 하는지 고민되는 상황이면 시간 판단이 꽤 중요해요. "
            f"{_timing_guidance(hours)} "
            "국내에서는 사후피임약을 바로 구매하는 방식이 아니라 진료 후 처방받아 조제하는 방식이라, 피임 실패 가능성이 마음에 걸린다면 가능한 빨리 진료 가능한 곳에 문의하는 게 좋겠습니다."
        )

    if _has_any(normalized_question, ["테스트", "임테기", "검사", "확인", "생리"]):
        return (
            "빨리 확인하고 싶은 마음이 들 수 있는데, 너무 이른 검사는 오히려 더 헷갈리게 만들 때가 있어요. "
            f"{_pregnancy_test_guidance(payload.get('expected_period'))} "
            "결과가 애매하거나 월경이 계속 늦어지면 그때는 혼자 판단하지 말고 진료 상담을 같이 잡아보는 게 좋습니다."
        )

    if _has_any(normalized_question, ["복통", "출혈", "피", "어지", "통증", "구토", "메스꺼움"]) or symptoms:
        return (
            "증상이 같이 있으면 단순히 임신 가능성만 따로 보기보다 몸 상태를 먼저 챙기는 게 좋아요. "
            "특히 심한 복통, 많은 출혈, 어지럼, 실신할 것 같은 느낌이 있으면 기다리지 말고 진료 가능한 의료기관에 바로 문의해 주세요. "
            "증상이 가볍더라도 계속 반복되면 산부인과 상담을 받아보는 편이 마음도 몸도 더 안전합니다."
        )

    return (
        "질문하신 부분만 놓고 답하면, 지금 정보만으로 임신 여부를 딱 잘라 말하기는 어렵습니다. "
        "그래도 피임을 제대로 했고 특별한 실패 정황이 없었다면 가능성은 낮은 편으로 볼 수 있어요. "
        "다만 불안이 계속되거나 생리가 늦어지거나 몸에 평소와 다른 증상이 있으면, 임신 테스트 시점과 진료 상담을 같이 확인해보는 게 좋겠습니다."
    )


def _initial_counseling_answer(payload: dict, hours: int | None) -> str:
    issue = payload.get("contraception_issue") or "입력 없음"
    contraception = payload.get("contraception") or "입력 없음"
    symptoms = payload.get("symptoms") or "입력 없음"
    question = payload.get("question") or "임신 가능성과 다음 행동이 궁금합니다."

    details = []
    if contraception not in {"입력 없음", "없음"}:
        details.append(f"피임은 {contraception}으로 알려주셨고")
    if issue not in {"입력 없음", "없음"}:
        details.append(f"피임과 관련해서는 {issue} 상황이 있었다고 적어주셨어요")
    if symptoms not in {"입력 없음", "없음", "증상 없음"}:
        details.append(f"현재 증상은 {symptoms}로 이해했어요")

    intro = " ".join(details) if details else "지금 적어주신 정보만으로는 조심스럽게 봐야 해요."
    return (
        f"{intro} 임신 가능성을 볼 때는 관계 후 시간이 얼마나 지났는지, 피임 과정에서 변수가 있었는지가 특히 중요합니다. "
        f"{_timing_guidance(hours)} "
        "피임을 했다면 가능성은 낮아질 수 있지만, 어떤 방법도 100%를 보장하지는 않아서 단정적으로 말하기는 어렵습니다. 제대로 사용했고 특별한 문제가 없었다면 가능성은 낮은 편으로 볼 수 있어요. "
        f"{_pregnancy_test_guidance(payload.get('expected_period'))} "
        f"질문하신 “{question}”에 대해서는 지금 상황을 기준으로 차분히 확인해보면 좋겠습니다. 불안이 계속 크거나 생리가 늦어지면 테스트 시점과 진료 상담을 같이 확인해 주세요."
    )


def _result_label(payload: dict, hours: int | None) -> tuple[str, str]:
    contraception = payload.get("contraception") or ""
    issue = payload.get("contraception_issue") or ""
    symptoms = payload.get("symptoms") or ""
    issue_text = f"{contraception} {issue}"

    urgent_symptom = _has_any(symptoms, ["심한 복통", "많은 출혈", "어지럼", "실신", "극심", "호흡", "고열"])
    possible_failure = _has_any(issue_text, ["사용하지 않음", "확실하지", "콘돔 파손", "질외사정", "피임약 누락", "기타"])

    if urgent_symptom:
        return "진료 상담 우선", "복통·출혈·어지럼 같은 증상은 임신 가능성과 별개로 몸 상태 평가가 먼저 필요할 수 있습니다."
    if hours is not None and hours <= 120 and possible_failure:
        return "응급피임 처방 상담 권장", "관계 후 120시간 이내이고 피임 실패 또는 불확실한 상황이 있어 처방 가능 여부를 빨리 확인하는 것이 좋습니다."
    if possible_failure:
        return "임신 확인 필요", "피임 실패 또는 불확실한 상황이 있어 임신 가능성을 낮다고 단정하기 어렵습니다."
    if contraception == "사용함" and issue == "없음":
        return "가능성 낮음", "피임을 사용했고 특별한 실패 정황이 없다면 임신 가능성은 낮은 편으로 볼 수 있습니다."

    return "추가 정보 필요", "마지막 관계 시점, 피임 방법, 생리 예정일 정보가 있어야 더 정확히 정리할 수 있습니다."


def _result_answer(payload: dict, hours: int | None) -> str:
    label, reason = _result_label(payload, hours)
    contraception = payload.get("contraception") or "입력 없음"
    issue = payload.get("contraception_issue") or "입력 없음"
    symptoms = payload.get("symptoms") or "입력 없음"
    expected_period = payload.get("expected_period") or "입력 없음"

    timing = f"{hours}시간 경과" if hours is not None else "마지막 관계 시점 입력 없음"

    actions = []
    if label == "응급피임 처방 상담 권장":
        actions.append("가까운 산부인과, 진료 가능한 의원, 응급실에 전화로 응급피임 처방 상담 가능 여부를 확인하세요.")
        actions.append("방문 전 진료 가능 시간과 접수 마감 시간을 확인하세요.")
    elif label == "가능성 낮음":
        actions.append("생리 예정일이 지나도 월경이 없으면 임신 테스트를 확인하세요.")
        actions.append("불안이 계속 크면 산부인과 상담을 예약하세요.")
    elif label == "진료 상담 우선":
        actions.append("심한 복통, 많은 출혈, 어지럼이 있으면 지체하지 말고 진료 가능한 의료기관에 문의하세요.")
        actions.append("증상이 심하면 응급실 이용도 고려하세요.")
    else:
        actions.append("생리 예정일 또는 마지막 생리 시작일을 입력하면 확인 시점을 더 정리할 수 있습니다.")
        actions.append("피임 실패가 의심되거나 월경이 늦어지면 산부인과 상담을 확인하세요.")

    return f"""
결과: {label}

입력 기준:
- 관계 후 시간: {timing}
- 피임 여부: {contraception}
- 피임 관련 상황: {issue}
- 생리 예정일: {expected_period}
- 현재 증상: {symptoms}

판단 근거:
{reason} 다만 이 결과는 입력값 기반 안내이며 임신 여부를 확정하는 진단은 아닙니다.

다음 행동:
{chr(10).join(f"- {action}" for action in actions)}
""".strip()


def answer_pregnancy_possibility(payload: dict) -> dict:
    references = [dict(reference) for reference in BASE_REFERENCES]

    hours = _hours_since_relation(payload.get("last_relation_at"))
    answer = _result_answer(payload, hours)

    return {
        "answer": answer,
        "references": references,
        "source_note": "입력값 기반 결과입니다. 의료 판단은 담당 의료진 상담이 필요합니다.",
    }
