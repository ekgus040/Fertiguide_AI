const CHECKLIST_SECTIONS = [
  {
    title: "시술 전",
    items: [
      "복용 중인 약/영양제 목록 정리",
      "이전 검사 결과 챙기기",
      "배우자/파트너 검사 여부 확인",
      "시술 일정과 내원 횟수 확인",
    ],
  },
  {
    title: "시술 과정 중",
    items: [
      "주사/약 복용법을 정확히 확인",
      "심한 복통, 호흡곤란, 급격한 체중 증가 등 이상 증상 시 병원 문의",
      "채취/이식 전후 주의사항 병원별 확인",
    ],
  },
  {
    title: "시술 후",
    items: [
      "결과 확인 일정 확인",
      "다음 차수 판단 기준 질문",
      "남은 배아/동결 보관 관련 질문",
    ],
  },
];

export default function TreatmentSafetyChecklist() {
  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-bold text-emerald-700">시술 중 체크리스트</p>
        <h3 className="text-xl font-bold text-slate-950">난임 시술 중 주의사항</h3>
      </div>

      <div className="space-y-4">
        {CHECKLIST_SECTIONS.map((section) => (
          <section key={section.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="font-bold text-slate-950">{section.title}</div>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
        <div className="font-bold">중요 안내</div>
        <p className="mt-1">
          이 체크리스트는 <strong>상담 준비용</strong>입니다. 시술 전후 행동 지침은 반드시 담당 의료진의
          안내를 따르세요.
        </p>
      </div>
    </div>
  );
}
