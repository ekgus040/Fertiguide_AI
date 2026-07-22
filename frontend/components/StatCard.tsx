type Props = {
  title: string;
  data: any[];
};

const TITLE_MAP: Record<string, string> = {
  "연령대·원인별 시술 현황": "연령대 및 원인별 시술 현황",
  "시술 과정별 현황": "시술 과정별 현황",
  "시술 차수별 현황": "시술 차수별 현황",
};

function formatNumber(value: any) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") return value.toLocaleString();
  return value;
}

function displayTitle(title: string) {
  return TITLE_MAP[title] || title || "통계 정보";
}

export default function StatCard({ title, data }: Props) {
  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-bold text-emerald-700">공공데이터 참고</p>
        <h3 className="text-xl font-bold text-slate-950">{displayTitle(title)}</h3>
      </div>

      {data.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
          선택한 조건에 해당하는 데이터가 없습니다. 백엔드 데이터 적재 상태와 컬럼명을 확인해주세요.
        </p>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 6).map((item, index) => (
            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="font-bold text-slate-900">{item.treatment_type || item.attempt_round || "통계 항목"}</div>

              <div className="mt-2 space-y-1 text-sm text-slate-600">
                {item.age_group && <div>연령대: {item.age_group}</div>}
                {item.total_count !== undefined && <div>전체 건수: {formatNumber(item.total_count)}건</div>}
                {item.selected_cause && (
                  <div>
                    {item.selected_cause}: {formatNumber(item.selected_cause_count)}건
                  </div>
                )}
                {item.completed_count !== undefined && <div>시술 완료 건수: {formatNumber(item.completed_count)}건</div>}
                {item.attempt_round && (
                  <div>
                    차수: {item.attempt_round} / 건수: {formatNumber(item.total_count)}건
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        공공데이터 기반 참고 정보이며, 개인별 진단이나 치료 방향을 의미하지 않습니다.
      </p>
    </div>
  );
}
