"use client";

type TreatmentComparison = {
  treatment_type: string;
  total_count: number;
  selected_cause?: string;
  selected_cause_count?: number;
};

type CauseByTreatment = {
  treatment_type: string;
  count: number;
  total_count: number;
  share: number;
};

type AgePosition = {
  age_group: string;
  total_count: number;
  selected_cause_count: number;
  rank: number;
  is_selected: boolean;
};

type TreatmentDescription = {
  treatment_type: string;
  description: string;
};

type Props = {
  data: {
    year?: number;
    selected_age_group?: string;
    selected_cause?: string;
    treatment_comparison?: TreatmentComparison[];
    selected_cause_total?: number | null;
    selected_cause_by_treatment?: CauseByTreatment[];
    age_position?: AgePosition[];
    selected_position?: AgePosition | null;
    position_metric?: string;
    treatment_descriptions?: TreatmentDescription[];
  };
};

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString();
}

function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

function BarRow({
  label,
  value,
  max,
  accent = false,
  aside,
}: {
  label: string;
  value: number;
  max: number;
  accent?: boolean;
  aside?: string;
}) {
  const width = `${Math.max((value / max) * 100, value > 0 ? 6 : 0)}%`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="shrink-0 text-slate-500">{aside || `${formatNumber(value)}건`}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${accent ? "bg-emerald-700" : "bg-teal-500"}`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

export default function AgeCauseInsightsCard({ data }: Props) {
  const treatmentComparison = data.treatment_comparison || [];
  const causeByTreatment = data.selected_cause_by_treatment || [];
  const agePosition = data.age_position || [];
  const descriptions = data.treatment_descriptions || [];

  const treatmentMax = maxValue(treatmentComparison.map((item) => item.total_count || 0));
  const causeMax = maxValue(causeByTreatment.map((item) => item.count || 0));
  const positionKey = data.position_metric === "selected_cause_count" ? "selected_cause_count" : "total_count";
  const ageMax = maxValue(agePosition.map((item) => item[positionKey] || 0));

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-bold text-emerald-700">공공데이터 참고</p>
        <h3 className="text-xl font-bold text-slate-950">연령대 및 원인별 시술 현황</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {data.year ? `${data.year}년 기준 · ` : ""}
          {data.selected_age_group || "선택 연령대"}
          {data.selected_cause ? ` · ${data.selected_cause}` : ""}
        </p>
      </div>

      {treatmentComparison.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
          선택한 조건에 해당하는 연령대 및 원인별 데이터가 없습니다.
        </p>
      ) : (
        <div className="space-y-6">
          <section>
            <h4 className="mb-3 text-sm font-bold text-slate-950">① 선택 연령대의 시술 유형 비교</h4>
            <div className="space-y-3">
              {treatmentComparison.map((item) => (
                <BarRow
                  key={item.treatment_type}
                  label={item.treatment_type}
                  value={item.total_count}
                  max={treatmentMax}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-950">② 선택 난임 원인의 건수</h4>
              {data.selected_cause_total !== null && data.selected_cause_total !== undefined && (
                <span className="text-sm font-semibold text-emerald-700">
                  합계 {formatNumber(data.selected_cause_total)}건
                </span>
              )}
            </div>
            {causeByTreatment.length > 0 ? (
              <div className="space-y-3">
                {causeByTreatment.map((item) => (
                  <BarRow
                    key={item.treatment_type}
                    label={item.treatment_type}
                    value={item.count}
                    max={causeMax}
                    accent
                    aside={`${formatNumber(item.count)}건 · ${item.share}%`}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                난임 원인을 선택하면 해당 원인 건수를 시술 유형별로 볼 수 있습니다.
              </p>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-950">③ 전체 연령대 중 내 연령대 위치</h4>
              {data.selected_position && (
                <span className="text-sm font-semibold text-emerald-700">
                  {data.selected_position.rank}위
                </span>
              )}
            </div>
            <div className="space-y-3">
              {agePosition.map((item) => {
                const value = item[positionKey] || 0;
                return (
                  <BarRow
                    key={item.age_group}
                    label={item.age_group}
                    value={value}
                    max={ageMax}
                    accent={item.is_selected}
                    aside={`${formatNumber(value)}건`}
                  />
                );
              })}
            </div>
          </section>

          <section>
            <h4 className="mb-3 text-sm font-bold text-slate-950">④ 시술 유형별 설명</h4>
            <div className="space-y-3">
              {descriptions.map((item) => (
                <div key={item.treatment_type} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="font-bold text-slate-900">{item.treatment_type}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        공공데이터 기반 참고 정보이며, 개인별 진단이나 치료 방향을 의미하지 않습니다.
      </p>
    </div>
  );
}
