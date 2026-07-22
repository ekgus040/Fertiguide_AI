type ProcessStat = {
  year: number;
  treatment_type: string;
  age_group: string;
  ovulation_induction_count: number;
  sperm_retrieval_count: number;
  egg_retrieval_count: number;
  fertilization_count: number;
  completed_count: number;
};

type ProcessStep = {
  label: string;
  field?: keyof ProcessStat;
  description: string;
};

type Props = {
  treatmentType?: string;
  ageGroup?: string;
  processData?: ProcessStat[];
};

const DEFAULT_TREATMENT = "체외수정";

const PROCESS_STEPS: Record<string, ProcessStep[]> = {
  인공수정: [
    { label: "상담 및 검사", description: "시술 전 기본 검사와 상담을 진행합니다." },
    { label: "배란유도", field: "ovulation_induction_count", description: "배란 시기와 난포 성장을 확인하는 과정입니다." },
    { label: "정자획득", field: "sperm_retrieval_count", description: "시술에 사용할 정자를 준비하는 과정입니다." },
    { label: "시술완료", field: "completed_count", description: "인공수정 시술이 완료된 건수입니다." },
  ],
  신선배아: [
    { label: "상담 및 검사", description: "시술 전 기본 검사와 상담을 진행합니다." },
    { label: "배란유도", field: "ovulation_induction_count", description: "난자 채취 전 난포 성장을 돕고 확인하는 과정입니다." },
    { label: "정자획득", field: "sperm_retrieval_count", description: "수정에 사용할 정자를 준비하는 과정입니다." },
    { label: "난자채취", field: "egg_retrieval_count", description: "성숙한 난자를 채취하는 과정입니다." },
    { label: "배아수정", field: "fertilization_count", description: "난자와 정자를 수정해 배아를 만드는 과정입니다." },
    { label: "시술완료", field: "completed_count", description: "신선배아 시술이 완료된 건수입니다." },
  ],
  동결배아: [
    { label: "상담 및 검사", description: "이식 전 자궁 상태와 일정 등을 확인합니다." },
    { label: "자궁내막 준비", description: "배아가 착상할 수 있도록 자궁내막 상태를 준비하고 확인합니다." },
    { label: "배아 해동", description: "이전 주기에서 생성·보관된 동결 배아를 이식 일정에 맞춰 해동합니다." },
    { label: "배아 이식", description: "해동한 배아를 자궁 안으로 이식하는 과정입니다." },
    { label: "시술완료", field: "completed_count", description: "동결배아 이식이 완료된 건수입니다." },
  ],
};

function formatNumber(value?: number) {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString();
}

function selectedRows(treatmentType: string, processData: ProcessStat[]) {
  if (processData.length === 0) return [];

  if (treatmentType === "체외수정") {
    return processData.filter((row) => row.treatment_type === "신선배아" || row.treatment_type === "동결배아");
  }

  return processData.filter((row) => row.treatment_type === treatmentType);
}

function fallbackTreatments(treatmentType: string) {
  if (treatmentType === "체외수정") return ["신선배아", "동결배아"];
  if (PROCESS_STEPS[treatmentType]) return [treatmentType];
  return ["인공수정", "신선배아", "동결배아"];
}

function StatBadge({ value }: { value?: number }) {
  if (!value) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
        미실시/빈값
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
      {formatNumber(value)}건
    </span>
  );
}

function FrozenEmbryoNotice() {
  return (
    <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
      <div className="font-bold">동결배아 시술 과정</div>
      <p className="mt-1">
        이 데이터는 <strong>동결배아 이식 기준</strong>입니다. 동결배아는 이전 주기에서 생성·보관된 배아를
        사용하는 경우가 많아, 난자채취·정자획득·배아수정 단계는 해당 데이터에서 별도로 집계되지 않을 수 있습니다.
      </p>
    </div>
  );
}

export default function ProcessTimeline({ treatmentType = DEFAULT_TREATMENT, ageGroup, processData = [] }: Props) {
  const rows = selectedRows(treatmentType, processData);
  const visibleTreatments = rows.length > 0 ? rows.map((row) => row.treatment_type) : fallbackTreatments(treatmentType);
  const selectedYear = rows[0]?.year;
  const selectedAgeGroup = rows[0]?.age_group || ageGroup;

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-bold text-emerald-700">시술 과정 타임라인</p>
        <h3 className="text-xl font-bold text-slate-950">HIRA 과정별 현황 보기</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {selectedYear ? `${selectedYear}년 기준 · ` : ""}
          {selectedAgeGroup || "선택 연령대"} · {treatmentType}
        </p>
      </div>

      <div className="space-y-4">
        {visibleTreatments.map((visibleTreatment) => {
          const row = rows.find((item) => item.treatment_type === visibleTreatment);
          const steps = PROCESS_STEPS[visibleTreatment] || PROCESS_STEPS[DEFAULT_TREATMENT];

          return (
            <section key={visibleTreatment} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="font-bold text-slate-950">{visibleTreatment}</div>
                {row?.completed_count !== undefined && (
                  <span className="text-xs font-semibold text-slate-500">
                    완료 {formatNumber(row.completed_count)}건
                  </span>
                )}
              </div>

              {visibleTreatment === "동결배아" && <FrozenEmbryoNotice />}

              <div className="space-y-3">
                {steps.map((step, index) => {
                  const value = step.field && row ? row[step.field] : undefined;
                  const hasHiraMetric = Boolean(step.field);

                  return (
                    <div key={`${visibleTreatment}-${step.label}`} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-bold text-slate-900">{step.label}</div>
                          {hasHiraMetric && <StatBadge value={typeof value === "number" ? value : undefined} />}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        HIRA 과정별 현황은 인공수정·신선배아·동결배아를 연령대별로 나눈 참고 데이터입니다.
        해당 시술유형에서 실시되지 않는 과정은 원자료에서 빈값으로 제공될 수 있어 미실시/빈값으로 표시합니다.
      </p>
    </div>
  );
}
