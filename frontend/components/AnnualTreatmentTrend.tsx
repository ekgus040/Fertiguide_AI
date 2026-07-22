"use client";

import { useEffect, useState } from "react";
import { fetchAnnualTreatmentStats } from "@/lib/api";

type AnnualTreatment = {
  year: number;
  patient_count: number;
  treatment_count: number;
  treatments_per_person: string;
};

function formatNumber(value?: number) {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString();
}

export default function AnnualTreatmentTrend() {
  const [data, setData] = useState<AnnualTreatment[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchAnnualTreatmentStats()
      .then((result) => {
        setData(result.data || []);
        setFailed(false);
      })
      .catch(() => {
        setFailed(true);
      });
  }, []);

  const maxTreatment = Math.max(...data.map((item) => item.treatment_count), 1);
  const latest = data[data.length - 1];

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-bold text-emerald-700">연도별 현황</p>
        <h3 className="text-xl font-bold text-slate-950">난임시술 이용 추이</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          국민건강보험공단 연도별 난임시술 현황 자료를 참고합니다.
        </p>
      </div>

      {data.length > 0 ? (
        <div className="space-y-4">
          {latest && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="font-semibold text-slate-500">최근 연도</div>
                <div className="mt-1 text-base font-bold text-slate-950">{latest.year}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="font-semibold text-slate-500">진료인원</div>
                <div className="mt-1 text-base font-bold text-slate-950">{formatNumber(latest.patient_count)}명</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="font-semibold text-slate-500">1인당</div>
                <div className="mt-1 text-base font-bold text-slate-950">{latest.treatments_per_person}건</div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {data.map((item) => {
              const width = `${Math.max((item.treatment_count / maxTreatment) * 100, 5)}%`;
              return (
                <div key={item.year} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-800">{item.year}년</span>
                    <span className="shrink-0 text-slate-500">{formatNumber(item.treatment_count)}건</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-700" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
          {failed ? "연도별 현황 데이터를 불러오지 못했습니다." : "연도별 현황 데이터를 불러오는 중입니다."}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        이 자료는 전체 이용 추이를 이해하기 위한 참고 정보이며, 개인의 진단이나 시술 필요성을 의미하지 않습니다.
      </p>
    </div>
  );
}
