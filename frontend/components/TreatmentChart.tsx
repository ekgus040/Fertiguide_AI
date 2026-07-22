"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  data: any[];
};

export default function TreatmentChart({ data }: Props) {
  const chartData = data
    .filter((item) => item.treatment_type && item.total_count !== undefined)
    .map((item) => ({
      name: item.treatment_type,
      value: item.total_count,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-bold text-emerald-700">시각화</p>
        <h3 className="text-xl font-bold text-slate-950">시술 유형별 건수</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip
              cursor={{ fill: "#ecfdf5" }}
              contentStyle={{
                border: "1px solid #d1fae5",
                borderRadius: 16,
                boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
              }}
            />
            <Bar dataKey="value" fill="#047857" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
