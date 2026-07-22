"use client";

const HIRA_HEALTH_MAP_URL = "https://www.hira.or.kr/ra/hosp/getHealthMap.do";
const HIRA_SPECIAL_INSTITUTION_URL =
  "https://www.hira.or.kr/ra/spclMgtAdmInfm/spclMgtAdmInfm.do?isBanner=6344&pgmid=HIRAA030003000000";

const CARDS = [
  {
    title: "난임시술 지정기관 확인",
    badge: "난임시술",
    description:
      "HIRA 특수운영기관 정보에서 난임시술 항목을 선택해 지정기관을 확인하는 흐름입니다. 추천 병원이 아니라 HIRA 기준 기관 정보 확인용입니다.",
    details: ["특수운영기관 정보에서 난임시술 항목 확인", "기관별 주소와 전화번호는 HIRA 화면에서 최신 정보 확인", "방문 전 상담 가능 여부를 기관에 직접 문의"],
    buttonLabel: "난임시술 지정기관 보기",
    url: HIRA_SPECIAL_INSTITUTION_URL,
  },
  {
    title: "근처 산부인과·야간/휴일진료·약국 확인",
    badge: "통합 확인",
    description:
      "산부인과, 야간/휴일 진료기관, 약국은 하나의 확인 경로로 통합했습니다. 현재 위치나 지역 조건은 HIRA 공식 화면에서 직접 선택해 확인하세요.",
    details: ["가까운 산부인과 확인", "야간/휴일 진료 가능 기관 확인", "처방 후 조제 가능한 근처 약국 확인"],
    buttonLabel: "근처 기관 통합 확인하기",
    url: HIRA_HEALTH_MAP_URL,
  },
];

export default function InstitutionFinder() {
  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-bold text-emerald-700">HIRA 기준 기관 정보 보기</p>
        <h3 className="mt-1 text-2xl font-bold text-slate-950">가까운 기관 확인 경로</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          병원을 추천하는 기능이 아니라 HIRA 공식 화면으로 이동해 기관 정보를 확인하는 기능입니다. 산부인과, 야간/휴일진료, 약국은 하나의
          통합 확인 경로로 분리했습니다.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CARDS.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-700">{card.badge}</div>
                <h4 className="mt-1 text-xl font-bold text-slate-950">{card.title}</h4>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            <div className="mt-4 space-y-2">
              {card.details.map((detail, index) => (
                <div key={detail} className="flex gap-3 rounded-xl bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
            <a
              href={card.url}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              {card.buttonLabel}
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
