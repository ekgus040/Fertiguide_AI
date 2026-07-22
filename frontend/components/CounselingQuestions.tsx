type Props = {
  ageGroup?: string;
  cause?: string;
  treatment?: string;
};

export default function CounselingQuestions({ ageGroup, cause, treatment }: Props) {
  const questions = [
    `${ageGroup || "선택한 연령대"}와 ${cause || "선택한 원인"}을 고려할 때 우선 확인해야 할 시술 선택지는 무엇인가요?`,
    `${treatment || "관심 시술"}을 진행하기 전에 추가로 필요한 검사나 준비가 있나요?`,
    "인공수정, 신선배아, 동결배아 중 어떤 기준으로 방향을 정하면 좋을까요?",
    "시술을 중단하거나 다음 단계로 넘어가는 판단 기준은 무엇인가요?",
    "다음 방문 전 준비해야 할 검사, 서류, 생활 관리 항목은 무엇인가요?",
  ];

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-bold text-emerald-700">상담 질문</p>
        <h3 className="text-xl font-bold text-slate-950">병원에서 물어볼 질문</h3>
      </div>
      <ol className="space-y-3">
        {questions.map((question, index) => (
          <li key={question} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
              {index + 1}
            </span>
            <span>{question}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
