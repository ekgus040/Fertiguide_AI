"use client";

import { useEffect, useState } from "react";
import { fetchSeoulPregnancySupports, type SeoulPregnancySupport, type SeoulSupportStage } from "@/lib/api";

type SupportScope = "seoul" | "other";

const CHECKLIST = [
  "임신 확인 후 산부인과 첫 방문 일정을 잡기",
  "복용 중인 약과 영양제를 의료진에게 확인하기",
  "서울시 또는 거주 지역 지원사업 신청 가능 여부 살펴보기",
  "심한 복통, 출혈, 어지럼 등 이상 증상은 바로 진료 문의하기",
];

const OTHER_SUPPORTS = [
  {
    title: "한부모가족 지원 정보",
    agency: "성평등가족부",
    url: "https://www.mogef.go.kr/cs/opf/cs_opf_f911.do",
    scope: "임신·출산, 양육, 법률, 자립, 주거, 양육비 이행 등 한부모가족에게 필요한 정책정보를 모아 안내합니다.",
    amount: "사업별로 상이합니다. 임신·출산 진료비, 양육비, 주거·자립 지원 등 세부 사업별 금액을 확인해야 합니다.",
    target: "한부모가족, 미혼한부모, 양육비 이행 지원이 필요한 가정 등 세부 사업별 대상자",
    documents: "사업별 신청서, 소득·가족관계 확인 서류 등 세부 사업별로 다릅니다.",
    contact: "가족상담전화 1644-6621, 성평등가족부 대표 02-2100-6000 등",
  },
  {
    title: "국민행복카드 임신·출산 진료비",
    agency: "국민행복카드",
    url: "http://www.voucher.go.kr/voucher/pregnancy.do",
    scope: "임신·출산 관련 진료비와 약제·치료재료 구입비를 국민행복카드 바우처로 지원합니다.",
    amount: "임신 1회당 100만원 기준으로 안내되며, 다태아·분만취약지 등은 추가 지원 여부를 확인해야 합니다.",
    target: "임신·출산이 확인된 건강보험 가입자 또는 피부양자",
    documents: "건강보험 임신·출산 진료비 지급신청서, 필요 시 관계 확인 서류",
    contact: "카드사 고객센터, 국민건강보험공단 1577-1000, 보건복지상담센터 129",
  },
  {
    title: "김천시 임신지원금",
    agency: "김천시",
    url: "https://www.gc.go.kr/portal/contents.do?mId=2002020000",
    scope: "김천시에 거주하는 임신부의 건강증진을 위한 임신지원금을 지급합니다.",
    amount: "분만예정일 2026년 1월 1일 이후 임신부는 임신 1회당 30만원, 그 외 대상자는 기존 20만원으로 안내됩니다.",
    target: "신청일 기준 3개월 이상 김천시에 주민등록을 둔 임신부",
    documents: "신분증, 임신확인서, 주민등록표 초본, 외국인 임신부는 추가 증명서류",
    contact: "김천시보건소 모자보건실 054-421-2738, 2741",
  },
  {
    title: "광양시 임신축하지원금",
    agency: "광양시",
    url: "https://gwangyang.go.kr/menu.es?mid=a11209060421",
    scope: "태교, 건강관리, 임부복 구입, 산전진찰 교통비 등 임신부 생활 지원 목적의 지역상품권 지원입니다.",
    amount: "임신축하지원금 100만원, 모바일 지역상품권 chak으로 안내됩니다.",
    target: "신청일 기준 6개월 이상 광양시에 거주하고 임신 20주 이상인 임신부",
    documents: "신청서, 임신·출산 진료비 지급신청서, 임신 20주 이상 확인자료, 주민등록초본 등",
    contact: "광양시 출생보건과 출생지원팀 061-797-4027, 4891",
  },
  {
    title: "경기도 출산장려금·양육비 현황",
    agency: "경기도",
    url: "https://www.gg.go.kr/contents/contents.do?ciIdx=987110&menuId=266074",
    scope: "경기도 시·군별 출산장려금과 양육비 지원 현황을 한눈에 확인할 수 있습니다.",
    amount: "출산장려금은 시·군 자체사업으로 20만원~2,000만원, 양육비는 일부 시·군에서 월 3만원~20여만원으로 안내됩니다.",
    target: "해당 시·군 조례와 거주요건을 충족한 출산가정",
    documents: "시·군별 신청서, 출생신고·주민등록·거주기간 확인 서류 등 지자체별로 다릅니다.",
    contact: "경기도 인구정책담당관 또는 각 시·군 담당부서",
  },
  {
    title: "아이사랑 출산지원금 모아보기",
    agency: "임신육아종합포털 아이사랑",
    url: "https://www.childcare.go.kr/?menuno=279",
    scope: "전국 지자체별 출산지원금 정보를 게시판 형태로 모아 확인할 수 있습니다.",
    amount: "지역별로 다릅니다. 첫만남이용권, 출산장려금, 양육비 등 지자체별 지원 금액을 개별 게시글에서 확인해야 합니다.",
    target: "출생신고된 아동과 출산가정 등 지자체별 거주요건과 지원 기준을 충족한 대상자",
    documents: "지역별 신청서, 출생신고·주민등록·거주기간 확인 서류 등 지자체별로 다릅니다.",
    contact: "아이사랑 헬프데스크 1566-3232, 임신·출산·육아 상담 1644-7373 또는 각 지자체 담당부서",
  },
  {
    title: "보건복지부 임신·출산 진료비 지원사업",
    agency: "보건복지부",
    url: "https://www.mohw.go.kr/menu.es?mid=a10705020100",
    scope: "임신·출산 관련 진료비와 2세 미만 영유아 진료·약제·치료재료 본인부담금을 바우처로 지원합니다.",
    amount: "임신 1회당 100만원, 다태아 기본 140만원, 분만취약지 20만원 추가지원 등으로 안내됩니다.",
    target: "임신·출산이 확인된 건강보험 가입자 또는 피부양자, 일부 2세 미만 영유아 법정대리인",
    documents: "본인은 건강보험 임신·출산 진료비 지급신청서, 가족 신청 시 관계 입증 서류",
    contact: "보건복지상담센터 129, 국민건강보험공단 1577-1000, 보험급여과 044-202-2736",
  },
];

const STAGE_OPTIONS: Array<{
  id: SeoulSupportStage;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "pregnancy",
    label: "임신",
    title: "임신 중 받을 수 있는 서울시 지원사업",
    description: "임산부 진료비, 검사비, 교통비, 임신 원스톱서비스처럼 임신 기간에 확인하면 좋은 지원을 보여줍니다.",
  },
  {
    id: "birth",
    label: "출산·육아",
    title: "출산 후 받을 수 있는 서울시 지원사업",
    description: "첫만남이용권, 산모·신생아 건강관리, 육아휴직장려금, 보육료와 돌봄 지원을 보여줍니다.",
  },
];

function compactText(value?: string, fallback = "상세 내용은 기관 안내를 확인하세요.") {
  if (!value || value.trim() === "." || value.trim() === "") {
    return fallback;
  }

  return value.trim();
}

function SupportCard({ item }: { item: SeoulPregnancySupport }) {
  return (
    <article className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-700">{item.category || "서울시 지원사업"}</div>
          <h4 className="mt-1 text-lg font-bold leading-6 text-slate-950">{item.name}</h4>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-800">
          지원
        </span>
      </div>

      <p className="mt-3 max-h-24 overflow-hidden text-sm leading-6 text-slate-600">{compactText(item.description)}</p>

      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
        <div>
          <span className="font-bold text-slate-950">대상 </span>
          {compactText(item.target || item.target_age || item.interests, "사업별 대상 조건을 확인하세요.")}
        </div>
        <div>
          <span className="font-bold text-slate-950">이용 방법 </span>
          {compactText(item.method, "신청 및 이용 방법은 상세 안내에서 확인하세요.")}
        </div>
        {item.contact ? (
          <div className="flex gap-2">
            <span className="mt-0.5 shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">문의</span>
            <span>{compactText(item.contact)}</span>
          </div>
        ) : null}
        {item.regions ? (
          <div className="flex gap-2">
            <span className="mt-0.5 shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">지역</span>
            <span>{compactText(item.regions, "서울시")}</span>
          </div>
        ) : null}
      </div>

      {(item.apply_url || item.detail_url) ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {item.apply_url ? (
            <a
              href={item.apply_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              신청 보기
            </a>
          ) : null}
          {item.detail_url ? (
            <a
              href={item.detail_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
            >
              상세 보기
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function OtherSupportCard({ item }: { item: (typeof OTHER_SUPPORTS)[number] }) {
  const rows = [
    ["지원 범위", item.scope],
    ["지원 금액", item.amount],
    ["지원 대상", item.target],
    ["제출 서류", item.documents],
    ["기타 문의", item.contact],
  ];

  return (
    <article className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-bold text-emerald-700">{item.agency}</div>
          <h4 className="mt-1 text-lg font-bold leading-6 text-slate-950">{item.title}</h4>
        </div>
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">외부 지원</span>
      </div>

      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
        {rows.map(([label, value]) => (
          <div key={label}>
            <span className="font-bold text-slate-950">{label} </span>
            {value}
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700">
        자세한 사항은 아래 링크를 타고 홈페이지를 확인해 주세요.
      </p>

      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 block break-all rounded-full bg-emerald-700 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-800"
      >
        홈페이지 확인하기
      </a>
    </article>
  );
}

export default function SeoulPregnancySupportGuide() {
  const [selectedScope, setSelectedScope] = useState<SupportScope>("seoul");
  const [selectedStage, setSelectedStage] = useState<SeoulSupportStage>("pregnancy");
  const [items, setItems] = useState<SeoulPregnancySupport[]>([]);
  const [source, setSource] = useState("서울열린데이터광장 몽땅정보 만능키 사업 정보");
  const [message, setMessage] = useState("서울시 지원사업 정보입니다. 다른 지역은 '그 외 지원들'에서 공식 홈페이지로 확인해 주세요.");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchSeoulPregnancySupports(12, selectedStage)
      .then((data) => {
        if (!isMounted) return;

        setItems(data.items || []);
        setSource(data.source || "서울열린데이터광장 몽땅정보 만능키 사업 정보");
        setMessage("서울시 지원사업 정보입니다. 다른 지역은 '그 외 지원들'에서 공식 홈페이지로 확인해 주세요.");
      })
      .catch(() => {
        if (isMounted) {
          setError("서울시 지원사업 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStage]);

  const selectedStageContent = STAGE_OPTIONS.find((option) => option.id === selectedStage) || STAGE_OPTIONS[0];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
              임신·출산 지원사업
            </div>
            <h3 className="mt-4 text-3xl font-bold leading-tight text-slate-950">서울시와 그 외 지원사업을 나눠 확인하세요.</h3>
            <p className="mt-3 leading-7 text-slate-600">
              임신 중 필요한 지원과 출산 후 필요한 육아·휴직·돌봄 지원은 지역과 사업별로 다릅니다. 서울시 사업은 데이터 기반 목록으로,
              그 외 지원은 주요 공식 홈페이지로 연결해 확인할 수 있게 정리했습니다.
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-5">
            <div className="text-sm font-bold text-emerald-800">안내</div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{message}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              지원 대상, 금액, 신청 기간, 제출 서류는 자주 바뀔 수 있으니 신청 전 공식 안내를 확인해 주세요.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {CHECKLIST.map((item, index) => (
          <div key={item} className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
              {index + 1}
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{item}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-emerald-900/10 bg-white/70 p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-bold text-emerald-700">임신·출산 지원사업</div>
            <h3 className="mt-1 text-2xl font-bold text-slate-950">
              {selectedScope === "seoul" ? selectedStageContent.title : "그 외 임신·출산 지원 링크"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedScope === "seoul"
                ? selectedStageContent.description
                : "전국·지자체·유형별 지원사업을 요약해 보여주고, 자세한 내용은 공식 홈페이지에서 확인하도록 연결합니다."}
            </p>
          </div>
          <p className="text-sm text-slate-500">출처: {selectedScope === "seoul" ? source : "공식 홈페이지 링크"}</p>
        </div>

        <div className="mt-5 grid gap-2 rounded-2xl bg-white p-2 sm:inline-grid sm:grid-cols-2">
          {[
            { id: "seoul", label: "서울시" },
            { id: "other", label: "그 외 지원들" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                selectedScope === option.id ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
              onClick={() => setSelectedScope(option.id as SupportScope)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {selectedScope === "seoul" ? (
          <>
            <div className="mt-4 grid gap-2 rounded-2xl bg-white p-2 sm:inline-grid sm:grid-cols-2">
              {STAGE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                    selectedStage === option.id ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                  onClick={() => setSelectedStage(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600">
                <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-600" />
                서울시 지원사업을 불러오는 중입니다.
              </div>
            ) : error ? (
              <div className="mt-6 rounded-2xl bg-white p-5 text-sm font-semibold text-rose-700">{error}</div>
            ) : items.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600">
                현재 표시할 서울시 {selectedStageContent.label} 지원사업이 없습니다. API 설정을 확인해 주세요.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {items
                  .filter((item) => !item.name.includes("서울형 新일"))
                  .map((item) => (
                    <SupportCard key={item.name} item={item} />
                  ))}
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {OTHER_SUPPORTS.map((item) => (
              <OtherSupportCard key={item.url} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
