"use client";

import { useState } from "react";
import AgeCauseInsightsCard from "./AgeCauseInsightsCard";
import AnnualTreatmentTrend from "./AnnualTreatmentTrend";
import AttemptRoundsCard from "./AttemptRoundsCard";
import CounselingQuestions from "./CounselingQuestions";
import ProcessTimeline from "./ProcessTimeline";
import StatCard from "./StatCard";
import TreatmentSafetyChecklist from "./TreatmentSafetyChecklist";
import { sendChatMessage } from "@/lib/api";
import type { UserProfile } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  profile: UserProfile;
};

function renderInlineFormatting(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

function FormattedMessage({ content }: { content: string }) {
  return (
    <div className="space-y-1">
      {content.split("\n").map((line, index) => (
        <div key={index} className={line.trim() === "" ? "h-2" : undefined}>
          {renderInlineFormatting(line)}
        </div>
      ))}
    </div>
  );
}

export default function ChatBox({ profile }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "안녕하세요. 난임 시술 상담 준비를 도와드릴게요. 병원 방문 전에 정리하고 싶은 질문을 편하게 입력해주세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const nextMessages: Message[] = [...messages, { role: "user", content: userMessage }];
      const result = await sendChatMessage(userMessage, profile, nextMessages.slice(-10));
      setMessages((prev) => [...prev, { role: "assistant", content: result.answer }]);
      setCards(result.cards || []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "답변을 불러오는 중 문제가 발생했습니다. 백엔드 서버가 실행 중인지, API 주소가 올바른지 확인해주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const processCard = cards.find((card) => card.type === "process");
  const attemptCard = cards.find((card) => card.type === "attempt");

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-xl shadow-emerald-950/5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-emerald-700">AI 상담 준비 챗봇</p>
            <h2 className="text-2xl font-bold text-slate-950">질문을 정리해보세요</h2>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">온라인</div>
        </div>

        <div className="h-[520px] overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === "user"
                    ? "ml-auto bg-emerald-700 text-white"
                    : "border border-slate-200 bg-white text-slate-800"
                }`}
              >
                <FormattedMessage content={message.content} />
              </div>
            ))}

            {loading && (
              <div className="max-w-[88%] rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                답변을 정리하고 있어요...
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 원인불명인데 병원에서 무엇을 먼저 물어봐야 할까요?"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button
            type="button"
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            전송
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          이 서비스는 진단이나 치료 결정을 대신하지 않습니다. 정확한 판단은 난임 전문 의료진과 상담하세요.
        </p>
      </section>

      <aside className="space-y-4">
        <ProcessTimeline
          treatmentType={profile.treatment_interest}
          ageGroup={profile.age_group}
          processData={processCard?.data || []}
        />
        <CounselingQuestions
          ageGroup={profile.age_group}
          cause={profile.infertility_cause}
          treatment={profile.treatment_interest}
        />
        <TreatmentSafetyChecklist />
        <AnnualTreatmentTrend />
        {attemptCard && (
          <AttemptRoundsCard
            data={attemptCard.data || []}
            treatmentType={profile.treatment_interest}
            currentStage={profile.current_stage}
          />
        )}
        {cards.map((card, index) => (
          card.type === "age_cause" ? (
            <AgeCauseInsightsCard key={`${card.type}-${index}`} data={card.data} />
          ) : card.type === "process" || card.type === "attempt" ? null : (
            <StatCard key={`${card.type}-${index}`} title={card.title} data={card.data} />
          )
        ))}
      </aside>
    </div>
  );
}
