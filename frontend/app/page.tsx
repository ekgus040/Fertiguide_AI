"use client";

import { useRef, useState } from "react";
import ChatBox from "@/components/ChatBox";
import EmergencyContraceptionGuide from "@/components/EmergencyContraceptionGuide";
import InstitutionFinder from "@/components/InstitutionFinder";
import SeoulPregnancySupportGuide from "@/components/SeoulPregnancySupportGuide";
import UserProfileForm from "@/components/UserProfileForm";
import type { UserProfile } from "@/lib/api";

type ServiceMode = {
  id: "fertility" | "emergency" | "early-pregnancy" | "finder";
  title: string;
  subtitle: string;
  badge: string;
  items: string[];
};

const SERVICE_MODES: ServiceMode[] = [
  {
    id: "fertility",
    title: "난임 시술 상담 준비",
    subtitle: "HIRA 통계와 상담 질문을 바탕으로 병원 방문 전 확인할 내용을 정리합니다.",
    badge: "현재 이용 가능",
    items: ["연령대·원인·시술유형별 HIRA 통계", "시술 과정 안내", "병원 상담 질문 생성", "시술 중 체크리스트"],
  },
  {
    id: "emergency",
    title: "임신 가능성·응급피임 상담",
    subtitle: "관계 후 경과 시간과 피임 상황을 바탕으로 외부 안내 자료를 참고해 상담 흐름을 정리합니다.",
    badge: "RAG 상담",
    items: ["관계 후 경과 시간 확인", "피임 실패 가능성 정리", "응급피임 처방 상담 안내", "의료기관 확인 경로"],
  },
  {
    id: "early-pregnancy",
    title: "서울 임신·출산 지원사업",
    subtitle: "서울열린데이터광장 데이터를 바탕으로 임신 후 확인할 수 있는 서울시 지원사업을 보여줍니다.",
    badge: "서울 한정",
    items: ["서울시 지원사업 목록", "서울 임신 준비 체크", "신청·상세 링크", "다른 지역 추후 업데이트"],
  },
  {
    id: "finder",
    title: "병원·약국 찾기",
    subtitle: "난임시술 지정기관과 산부인과·야간/휴일진료·약국 확인 경로를 분리해 안내합니다.",
    badge: "HIRA 연결",
    items: ["난임시술 지정기관", "산부인과", "야간/휴일 진료기관", "약국"],
  },
];

const MODE_HELP: Record<ServiceMode["id"], { title: string; description: string; checks: string[] }> = {
  fertility: {
    title: "프로필을 입력하면 맞춤 상담 준비 화면이 열립니다.",
    description: "선택한 연령대, 난임 원인, 관심 시술을 기준으로 통계 카드와 병원 상담 질문을 함께 보여드립니다.",
    checks: ["HIRA 통계 비교", "시술 과정 타임라인", "차수별 현황", "지원금 안내 질문 대응"],
  },
  emergency: {
    title: "임신 가능성은 시간과 상황을 함께 봐야 합니다.",
    description:
      "관계 후 경과 시간, 피임 여부, 생리 일정, 현재 증상을 입력하면 외부 안내 자료를 참고해 다음 행동을 정리합니다. 자세한 내용은 의사와 상담해야 합니다.",
    checks: ["24/72/120시간 구간 확인", "임신 테스트 시점 안내", "처방 상담 필요성 안내", "공식 안내 링크 제공"],
  },
  "early-pregnancy": {
    title: "서울시 임신·출산 지원사업을 먼저 확인합니다.",
    description:
      "서울열린데이터광장 몽땅정보 만능키 사업 정보를 기반으로 임신 후 확인할 수 있는 지원사업을 보여줍니다. 다른 지역에 대한 지원 사업은 추후 업데이트 예정입니다.",
    checks: ["첫 병원 방문 준비", "서울시 지원사업 확인", "신청·상세 링크", "이상 증상 진료 문의"],
  },
  finder: {
    title: "기관 정보는 추천이 아니라 확인 경로로 제공합니다.",
    description:
      "난임시술 지정기관은 별도 경로로, 산부인과·야간/휴일진료·약국은 HIRA 건강지도 확인 경로로 통합해 안내합니다.",
    checks: ["난임시술 지정기관 보기", "근처 기관 통합 확인", "HIRA 공식 화면 연결", "방문 전 직접 확인 안내"],
  },
};

export default function HomePage() {
  const [selectedMode, setSelectedMode] = useState<ServiceMode["id"]>("fertility");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const modeRef = useRef<HTMLDivElement>(null);

  const selected = SERVICE_MODES.find((mode) => mode.id === selectedMode) || SERVICE_MODES[0];
  const modeHelp = MODE_HELP[selectedMode];

  const scrollToMode = () => {
    modeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleModeSelect = (modeId: ServiceMode["id"]) => {
    setSelectedMode(modeId);
    setProfile(null);
    window.setTimeout(scrollToMode, 0);
  };

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="border-b border-emerald-950/10 bg-[linear-gradient(120deg,#f7f3ec_0%,#e9f5ea_52%,#fff8eb_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white/75 px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              여성 건강 상담 준비 도우미
            </div>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 md:text-6xl">여성 건강 상담 준비 도우미</h1>
            <p className="text-lg leading-8 text-slate-700">
              상황을 먼저 고르면 통계 확인, 상담 질문, 체크리스트, 의료기관 확인 경로를 한 화면에서 정리해드립니다.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {SERVICE_MODES.map((mode) => {
              const isSelected = selectedMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleModeSelect(mode.id)}
                  className={`rounded-3xl border p-5 text-left shadow-sm transition cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                    isSelected
                      ? "border-emerald-700 bg-white shadow-emerald-950/10"
                      : "border-white/80 bg-white/65 hover:border-emerald-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold text-slate-950">{mode.title}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{mode.subtitle}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${isSelected ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {mode.badge}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {mode.items.map((item) => (
                      <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section ref={modeRef} className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <div className="mb-6 rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-bold text-emerald-700">선택한 모드</div>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{selected.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{modeHelp.description}</p>
            </div>
            <button
              type="button"
              onClick={scrollToMode}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold transition hover:border-emerald-700 hover:text-emerald-800"
            >
              현재 모드 보기
            </button>
          </div>
        </div>

        {selectedMode === "fertility" ? (
          !profile ? (
            <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div className="space-y-4 pt-2">
                <p className="text-sm font-bold text-emerald-700">먼저 기본 정보를 선택해 주세요</p>
                <h3 className="text-3xl font-bold leading-tight">난임 시술 상담 준비 화면을 열어드립니다.</h3>
                <p className="leading-7 text-slate-600">
                  입력값은 HIRA 통계 조회와 병원 상담 질문 생성을 위해 사용합니다. 정확한 판단은 난임 전문 의료진과 상담하세요.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {modeHelp.checks.map((check) => (
                    <div key={check} className="rounded-2xl border border-white bg-white/70 p-4 text-sm font-semibold text-slate-700">
                      {check}
                    </div>
                  ))}
                </div>
              </div>
              <UserProfileForm onSubmit={setProfile} />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-emerald-700">현재 입력 정보</div>
                    <div className="mt-1 text-lg font-bold">
                      {profile.age_group} · {profile.infertility_cause || "원인 모름"} · {profile.treatment_interest || "시술 미정"} ·{" "}
                      {profile.current_stage}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold transition hover:border-emerald-700 hover:text-emerald-800"
                    onClick={() => setProfile(null)}
                  >
                    다시 입력하기
                  </button>
                </div>
              </div>
              <ChatBox profile={profile} />
            </div>
          )
        ) : selectedMode === "emergency" ? (
          <EmergencyContraceptionGuide />
        ) : selectedMode === "early-pregnancy" ? (
          <SeoulPregnancySupportGuide />
        ) : (
          <InstitutionFinder />
        )}
      </section>
    </main>
  );
}
