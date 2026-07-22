"use client";

import { useState } from "react";
import type { UserProfile } from "@/lib/api";

type Props = {
  onSubmit: (profile: UserProfile) => void;
};

const AGE_GROUPS = ["25세 미만", "25~29세", "30~34세", "35~39세", "40~44세", "45세 이상"];
const CAUSES = [
  "남성요인",
  "배란기능장애",
  "난소기능저하",
  "난관요인",
  "자궁요인",
  "자궁내막증",
  "원인불명",
  "기타요인",
  "복합요인",
  "아직 모름",
];
const TREATMENTS = ["인공수정", "체외수정", "신선배아", "동결배아", "아직 모름"];
const STAGES = ["첫 상담 전", "검사 진행 중", "시술 상담 예정", "1차 시술 예정", "반복 시술 중"];

const TREATMENT_GUIDES = [
  {
    name: "인공수정",
    label: "IUI",
    summary: "배란 시기에 맞춰 정자를 자궁 안에 직접 주입하는 방식입니다.",
    detail: "배란은 되지만 자연임신 가능성을 조금 더 높이고 싶거나, 정자 운동성·원인불명 난임 등을 상담할 때 검토될 수 있습니다.",
  },
  {
    name: "체외수정",
    label: "IVF",
    summary: "난자와 정자를 몸 밖에서 수정시킨 뒤 배아를 자궁에 이식하는 방식입니다.",
    detail: "난관요인, 반복 실패, 난소기능저하, 남성요인 등 상황에 따라 검토되며 과정과 비용, 일정 상담이 중요합니다.",
  },
  {
    name: "신선배아",
    label: "Fresh",
    summary: "난자 채취와 수정 후 같은 주기에 배아를 바로 이식하는 방식입니다.",
    detail: "채취 후 몸 상태와 호르몬 상황이 적절할 때 고려되며, 과배란 반응이나 자궁 상태에 따라 달라질 수 있습니다.",
  },
  {
    name: "동결배아",
    label: "Frozen",
    summary: "배아를 얼려 보관한 뒤 이후 주기에 해동해 이식하는 방식입니다.",
    detail: "자궁 상태를 준비한 뒤 이식하거나, 남은 배아를 다음 시도에 활용할 때 검토될 수 있습니다.",
  },
];

export default function UserProfileForm({ onSubmit }: Props) {
  const [ageGroup, setAgeGroup] = useState("35~39세");
  const [cause, setCause] = useState("원인불명");
  const [treatment, setTreatment] = useState("체외수정");
  const [stage, setStage] = useState("첫 상담 전");

  const handleSubmit = () => {
    onSubmit({
      age_group: ageGroup,
      infertility_cause: cause === "아직 모름" ? undefined : cause,
      treatment_interest: treatment === "아직 모름" ? undefined : treatment,
      current_stage: stage,
    });
  };

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-xl shadow-emerald-950/5">
      <div className="mb-6">
        <div className="text-sm font-bold text-emerald-700">프로필 설정</div>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">상담 준비 시작하기</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          아래 항목을 선택하면 맞춤형 질문과 참고 통계를 확인할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectBox label="연령대" value={ageGroup} setValue={setAgeGroup} items={AGE_GROUPS} />
        <SelectBox label="난임 원인" value={cause} setValue={setCause} items={CAUSES} />
        <SelectBox label="관심 시술" value={treatment} setValue={setTreatment} items={TREATMENTS} />
        <SelectBox label="현재 단계" value={stage} setValue={setStage} items={STAGES} />
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-900/10 bg-emerald-50/60 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-bold text-emerald-800">관심 시술 이해하기</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              선택이 어렵다면 아래 설명을 먼저 보고, 병원 상담에서 내 상황에 맞는 방식을 확인해 보세요.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TREATMENT_GUIDES.map((guide) => (
            <article
              key={guide.name}
              className={`rounded-2xl border bg-white p-4 transition ${
                treatment === guide.name ? "border-emerald-600 shadow-sm shadow-emerald-900/10" : "border-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-950">{guide.name}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {guide.label}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">{guide.summary}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{guide.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="mt-6 w-full rounded-2xl bg-emerald-700 px-5 py-4 font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-300 active:scale-[0.99]"
        onClick={handleSubmit}
      >
        상담 준비 시작하기
      </button>
    </div>
  );
}

function SelectBox({
  label,
  value,
  setValue,
  items,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  items: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        {items.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
