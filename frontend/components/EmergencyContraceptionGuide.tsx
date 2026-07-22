"use client";

import { useState } from "react";
import { askPregnancyPossibility } from "@/lib/api";

const LOVEPLAN_URL = "https://www.loveplan.kr/home/126.htm";
const HIRA_HEALTH_MAP_URL = "https://www.hira.or.kr/ra/hosp/getHealthMap.do";
const EGEN_HOSPITAL_URL = "https://www.e-gen.or.kr/egen/search_hospital.do";
const EGEN_EMERGENCY_URL = "https://www.e-gen.or.kr/egen/search_emergency_room.do";
const PHARM114_URL = "https://www.pharm114.or.kr/main.do";
const SEOUL_NIGHT_CLINIC_URL = "https://scpm.seoul.go.kr/seoul-policy/evt0065";

const PRESCRIPTION_RESOURCES = [
  {
    title: "HIRA 병원·약국 찾기",
    description: "산부인과, 의원, 실시간 문 연 병원을 조건으로 찾아볼 수 있습니다.",
    url: HIRA_HEALTH_MAP_URL,
  },
  {
    title: "E-GEN 병원 찾기",
    description: "야간·휴일에 문 여는 병의원을 확인하고 방문 전 전화로 진료 가능 여부를 확인하세요.",
    url: EGEN_HOSPITAL_URL,
  },
  {
    title: "E-GEN 응급실 찾기",
    description: "응급 증상이 있거나 야간에 진료 가능한 곳이 없을 때 응급실 운영 정보를 확인하세요.",
    url: EGEN_EMERGENCY_URL,
  },
  {
    title: "휴일지킴이약국",
    description: "처방 후 조제 가능한 휴일·야간 약국을 PC 웹에서 확인할 수 있습니다.",
    url: PHARM114_URL,
  },
  {
    title: "서울 야간 진료 병의원 안내",
    description: "서울시 야간·휴일 진료 병의원 정보를 확인할 수 있습니다.",
    url: SEOUL_NIGHT_CLINIC_URL,
  },
];

function FormattedMessage({ content }: { content: string }) {
  return (
    <div className="space-y-1">
      {content.split("\n").map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        return (
          <p key={index}>
            {trimmed.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={partIndex}>{part.slice(2, -2)}</strong>
              ) : (
                <span key={partIndex}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function EmergencyContraceptionGuide() {
  const [lastRelationAt, setLastRelationAt] = useState("");
  const [contraception, setContraception] = useState("사용함");
  const [contraceptionIssue, setContraceptionIssue] = useState("없음");
  const [lastPeriodStart, setLastPeriodStart] = useState("");
  const [expectedPeriod, setExpectedPeriod] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [question, setQuestion] = useState("임신 가능성과 지금 해야 할 일을 알고 싶어요.");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (loading) return;
    setLoading(true);
    setResult(null);

    try {
      const result = await askPregnancyPossibility({
        last_relation_at: lastRelationAt,
        contraception,
        contraception_issue: contraceptionIssue,
        last_period_start: lastPeriodStart,
        expected_period: expectedPeriod,
        symptoms,
        question,
      });

      setResult(result.answer);
    } catch {
      setResult(
        "결과: 확인 실패\n\n입력값을 처리하지 못했습니다. 관계 후 시간이 짧거나 피임 실패 가능성이 있다면 가까운 산부인과 또는 진료 가능한 의료기관에 전화로 처방 상담 가능 여부를 확인하세요."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-bold text-emerald-700">임신 가능성·응급피임 상담</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-950">상황 입력</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            입력한 내용을 바탕으로 임신 가능성 확인 방향과 다음 행동을 결과 형태로 정리합니다. 임신 여부 확정이나 처방 판단은 의사 상담이 필요합니다.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">마지막 관계 시점</span>
            <input
              type="datetime-local"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              value={lastRelationAt}
              onChange={(event) => setLastRelationAt(event.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">피임 여부</span>
              <select
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                value={contraception}
                onChange={(event) => setContraception(event.target.value)}
              >
                <option>사용함</option>
                <option>사용하지 않음</option>
                <option>확실하지 않음</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">피임 관련 상황</span>
              <select
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                value={contraceptionIssue}
                onChange={(event) => setContraceptionIssue(event.target.value)}
              >
                <option>없음</option>
                <option>콘돔 파손</option>
                <option>질외사정</option>
                <option>피임약 누락</option>
                <option>기타/확실하지 않음</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">마지막 생리 시작일</span>
              <input
                type="date"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                value={lastPeriodStart}
                onChange={(event) => setLastPeriodStart(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">생리 예정일</span>
              <input
                type="date"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                value={expectedPeriod}
                onChange={(event) => setExpectedPeriod(event.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">현재 증상</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              placeholder="예: 복통, 출혈, 메스꺼움, 증상 없음"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">질문</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={handleSubmit}
            disabled={loading}
          >
            결과 확인하기
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-bold text-emerald-700">입력 기반 결과</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-950">임신 가능성 확인 결과</h3>
          </div>
          <div className="min-h-[360px] rounded-3xl border border-slate-200 bg-slate-50 p-5">
            {loading ? (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
                입력값을 바탕으로 결과를 정리하는 중입니다.
              </div>
            ) : result ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-800 shadow-sm">
                <FormattedMessage content={result} />
              </div>
            ) : (
              <div className="rounded-2xl bg-white px-5 py-4 text-sm leading-7 text-slate-600 shadow-sm">
                왼쪽에 관계 시점, 피임 상황, 생리 예정일, 증상을 입력한 뒤 결과를 확인하세요.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-emerald-700">응급피임 처방 상담 가능 기관 찾기</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            사후피임약은 의료진 진료와 처방 후 약국에서 조제받는 방식입니다. 방문 전 전화로 진료 가능 시간, 접수 마감, 처방 상담 가능 여부를 확인하세요.
          </p>
          <div className="mt-4 grid gap-3">
            {PRESCRIPTION_RESOURCES.map((resource) => (
              <a
                key={resource.url}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-600 hover:bg-white"
              >
                <span className="block text-sm font-bold text-slate-950">{resource.title}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{resource.description}</span>
                <span className="mt-2 block break-all text-xs font-semibold text-emerald-800">{resource.url}</span>
              </a>
            ))}
          </div>
          <a href={LOVEPLAN_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800">
            응급피임 안내 보기
          </a>
        </div>
      </section>
    </div>
  );
}
