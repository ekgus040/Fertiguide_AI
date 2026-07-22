type AttemptRound = {
  year: number;
  treatment_type: string;
  attempt_round: string;
  total_count: number;
};

type Props = {
  data: AttemptRound[];
  treatmentType?: string;
  currentStage?: string;
};

function formatNumber(value?: number) {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString();
}

function roundSortValue(round: string) {
  if (round.includes("10")) return 10;
  const digits = round.replace(/\D/g, "");
  return digits ? Number(digits) : 99;
}

function groupByTreatment(data: AttemptRound[]) {
  return data.reduce<Record<string, AttemptRound[]>>((groups, item) => {
    const key = item.treatment_type || "전체";
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function BarRow({ item, max }: { item: AttemptRound; max: number }) {
  const width = `${Math.max((item.total_count / max) * 100, item.total_count > 0 ? 5 : 0)}%`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-800">{item.attempt_round}</span>
        <span className="shrink-0 text-slate-500">{formatNumber(item.total_count)}건</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-700" style={{ width }} />
      </div>
    </div>
  );
}

export default function AttemptRoundsCard({ data, treatmentType, currentStage }: Props) {
  const grouped = groupByTreatment(data);
  const treatmentNames = Object.keys(grouped);
  const isRepeating = currentStage === "반복 시술 중";

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-bold text-emerald-700">시술 차수별 현황</p>
        <h3 className="text-xl font-bold text-slate-950">반복 시술 구간 확인하기</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          HIRA 시술횟수/차수 현황 · {treatmentType || "선택 시술"}
        </p>
      </div>

      {data.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
          선택한 시술 조건에 해당하는 차수별 데이터가 없습니다.
        </p>
      ) : (
        <div className="space-y-5">
          {isRepeating && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              현재 단계가 <strong>반복 시술 중</strong>으로 선택되어 있어요. 아래에서 2차 이상 구간의 분포를
              같이 확인하면 병원 상담 때 이전 차수 이후 계획을 묻는 데 도움이 됩니다.
            </div>
          )}

          {treatmentNames.map((name) => {
            const rows = [...grouped[name]].sort((a, b) => roundSortValue(a.attempt_round) - roundSortValue(b.attempt_round));
            const max = Math.max(...rows.map((item) => item.total_count), 1);
            const total = rows.reduce((sum, item) => sum + item.total_count, 0);
            const repeatTotal = rows
              .filter((item) => roundSortValue(item.attempt_round) >= 2)
              .reduce((sum, item) => sum + item.total_count, 0);
            const firstRound = rows.find((item) => roundSortValue(item.attempt_round) === 1);
            const year = rows[0]?.year;

            return (
              <section key={name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-950">{name}</div>
                    <div className="mt-1 text-xs text-slate-500">{year ? `${year}년 기준` : "연간 자료 기준"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-right text-xs sm:grid-cols-3">
                    <div className="rounded-xl bg-white px-3 py-2">
                      <div className="font-semibold text-slate-500">전체</div>
                      <div className="mt-1 font-bold text-slate-900">{formatNumber(total)}건</div>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2">
                      <div className="font-semibold text-slate-500">1차</div>
                      <div className="mt-1 font-bold text-slate-900">{formatNumber(firstRound?.total_count)}건</div>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2">
                      <div className="font-semibold text-slate-500">2차 이상</div>
                      <div className="mt-1 font-bold text-slate-900">{formatNumber(repeatTotal)}건</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {rows.map((item) => (
                    <BarRow key={`${name}-${item.attempt_round}`} item={item} max={max} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        HIRA 시술횟수/차수 현황은 인공수정과 체외수정의 차수별 현황을 제공하는 연간 업데이트 자료입니다.
        화면에는 2026년 3월 31일 등록·수정된 자료 기준 안내를 표시합니다.
      </p>
    </div>
  );
}
