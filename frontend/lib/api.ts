const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type UserProfile = {
  age_group: string;
  infertility_cause?: string;
  treatment_interest?: string;
  current_stage?: string;
  user_question?: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function sendChatMessage(message: string, profile: UserProfile, conversationHistory: ChatMessage[] = []) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      profile,
      conversation_history: conversationHistory,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send chat message");
  }

  return response.json();
}

export async function fetchFertilityPlaceSummary() {
  const response = await fetch(`${API_BASE_URL}/stats/places/summary`);

  if (!response.ok) {
    throw new Error("Failed to fetch fertility place summary");
  }

  return response.json();
}

export async function fetchAnnualTreatmentStats() {
  const response = await fetch(`${API_BASE_URL}/stats/annual-treatment`);

  if (!response.ok) {
    throw new Error("Failed to fetch annual treatment stats");
  }

  return response.json();
}

export type SeoulPregnancySupport = {
  name: string;
  category?: string;
  description?: string;
  target?: string;
  method?: string;
  contact?: string;
  regions?: string;
  target_age?: string;
  interests?: string;
  detail_url?: string;
  apply_url?: string;
};

export type SeoulSupportStage = "pregnancy" | "birth";

export async function fetchSeoulPregnancySupports(limit = 12, stage: SeoulSupportStage = "pregnancy") {
  const params = new URLSearchParams({
    limit: String(limit),
    stage,
  });
  const response = await fetch(`${API_BASE_URL}/support/seoul-pregnancy?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch Seoul pregnancy supports");
  }

  return response.json() as Promise<{
    source: string;
    service_name: string;
    is_seoul_only: boolean;
    stage?: SeoulSupportStage;
    total_count?: number;
    items: SeoulPregnancySupport[];
    message?: string;
  }>;
}

export type PregnancyPossibilityPayload = {
  last_relation_at?: string;
  contraception?: string;
  contraception_issue?: string;
  last_period_start?: string;
  expected_period?: string;
  symptoms?: string;
  question?: string;
  conversation_history?: Array<{ role: "user" | "assistant"; content: string }>;
  is_follow_up?: boolean;
};

export async function askPregnancyPossibility(payload: PregnancyPossibilityPayload) {
  const response = await fetch(`${API_BASE_URL}/pregnancy/possibility`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to ask pregnancy possibility guide");
  }

  return response.json() as Promise<{
    answer: string;
    references: Array<{ title: string; url?: string; summary: string }>;
    source_note: string;
  }>;
}
