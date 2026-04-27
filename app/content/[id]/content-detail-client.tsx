"use client";

import { useState } from "react";

type DetailItem = {
  id: string;
  title: string;
  url: string | null;
  rawText: string | null;
  summary: string | null;
  note: string | null;
  platform: string;
  author: string | null;
  submittedAt: Date;
  status: string;
  readStatus: string;
  isUrlOnly: boolean;
  analysis: {
    id: string;
    recommendedAction: string;
    readingValueScore: number;
    informationGainScore: number;
    sourceCredibilityScore: number;
    personalRelevanceScore: number;
    duplicationScore: number;
    marketingSuspicionScore: number;
    emotionalNoiseScore: number;
    coreSummary: string;
    coreClaims: string[];
    recommendationReasons: string[];
    skipReasons: string[];
    topicTags: string[];
    valueTags: string[];
    suggestedReadingMethod: string;
    modelName: string;
    analyzedAt: Date;
    version: number;
  } | null;
  feedbacks: Array<{
    id: string;
    feedbackType: string;
    note: string | null;
    createdAt: Date;
  }>;
};

const feedbackOptions = [
  "ACCURATE",
  "ACTUALLY_IMPORTANT",
  "SHOW_LESS_LIKE_THIS",
  "SOURCE_HIGH_QUALITY",
  "SOURCE_LOW_QUALITY",
  "TRACK_THIS_TOPIC",
  "BLOCK_THIS_SOURCE",
] as const;

export default function ContentDetailClient({ item }: { item: DetailItem }) {
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [feedbackType, setFeedbackType] = useState<(typeof feedbackOptions)[number]>("ACCURATE");
  const [note, setNote] = useState("");
  const [busyAnalyze, setBusyAnalyze] = useState(false);
  const [busyFeedback, setBusyFeedback] = useState(false);

  async function handleReanalyze() {
    setBusyAnalyze(true);
    setAnalysisStatus("");

    const requestId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const response = await fetch(`/api/content/${item.id}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    const data = await response.json();

    if (!response.ok) {
      setAnalysisStatus(data.error ?? "重新分析失败");
      setBusyAnalyze(false);
      return;
    }

    setAnalysisStatus("已触发重新分析，请刷新页面查看最新结果");
    setBusyAnalyze(false);
  }

  async function handleFeedbackSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyFeedback(true);
    setFeedbackStatus("");

    const response = await fetch(`/api/content/${item.id}/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ feedbackType, note }),
    });

    const data = await response.json();

    if (!response.ok) {
      setFeedbackStatus(data.error ?? "提交反馈失败");
      setBusyFeedback(false);
      return;
    }

    setFeedbackStatus("反馈已提交，请刷新页面查看最新反馈");
    setNote("");
    setBusyFeedback(false);
  }

  const a = item.analysis;

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{item.title}</h1>
        <p className="text-sm text-zinc-600">
          {item.platform} · {item.status} · {item.readStatus} · {new Date(item.submittedAt).toLocaleString("zh-CN")}
        </p>
        {item.url ? (
          <a className="text-sm text-blue-600 hover:underline" href={item.url} target="_blank" rel="noreferrer">
            {item.url}
          </a>
        ) : null}
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
        <h2 className="text-xl font-medium">原始内容</h2>
        <p className="text-sm text-zinc-700 whitespace-pre-wrap">{item.rawText || item.summary || "暂无正文"}</p>
        {item.note ? <p className="text-sm text-zinc-500">备注：{item.note}</p> : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-medium">AI 分析结果</h2>
          <button className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60" disabled={busyAnalyze || item.isUrlOnly} onClick={handleReanalyze}>
            {busyAnalyze ? "分析中..." : "重新分析"}
          </button>
        </div>

        {item.isUrlOnly ? <p className="text-sm text-zinc-500">请补充正文或摘要后分析。</p> : null}
        {analysisStatus ? <p className="text-sm text-zinc-700">{analysisStatus}</p> : null}

        {a ? (
          <div className="space-y-3 text-sm">
            <p>
              推荐动作：<span className="font-medium">{a.recommendedAction}</span> · 阅读方式：{a.suggestedReadingMethod} · 版本：v{a.version}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <p>阅读价值：{a.readingValueScore}</p>
              <p>信息增量：{a.informationGainScore}</p>
              <p>来源可信：{a.sourceCredibilityScore}</p>
              <p>个人相关：{a.personalRelevanceScore}</p>
              <p>重复度：{a.duplicationScore}</p>
              <p>营销嫌疑：{a.marketingSuspicionScore}</p>
              <p>情绪噪音：{a.emotionalNoiseScore}</p>
            </div>
            <p>核心摘要：{a.coreSummary || "-"}</p>
            <div>
              <p className="font-medium">核心主张</p>
              {a.coreClaims.length === 0 ? <p>-</p> : <ul className="list-disc pl-5">{a.coreClaims.map((claim) => <li key={claim}>{claim}</li>)}</ul>}
            </div>
            <div>
              <p className="font-medium">推荐理由</p>
              {a.recommendationReasons.length === 0 ? <p>-</p> : <ul className="list-disc pl-5">{a.recommendationReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
            </div>
            <div>
              <p className="font-medium">跳过理由</p>
              {a.skipReasons.length === 0 ? <p>-</p> : <ul className="list-disc pl-5">{a.skipReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
            </div>
            <p>主题标签：{a.topicTags.join("、") || "-"}</p>
            <p>价值标签：{a.valueTags.join("、") || "-"}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">暂无分析结果</p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
        <h2 className="text-xl font-medium">提交反馈</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleFeedbackSubmit}>
          <select className="rounded border border-zinc-300 px-3 py-2" value={feedbackType} onChange={(event) => setFeedbackType(event.target.value as (typeof feedbackOptions)[number])}>
            {feedbackOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input className="rounded border border-zinc-300 px-3 py-2" value={note} onChange={(event) => setNote(event.target.value)} placeholder="可选备注" />
          <button className="rounded bg-zinc-800 px-4 py-2 text-white disabled:opacity-60 md:col-span-2" disabled={busyFeedback} type="submit">
            {busyFeedback ? "提交中..." : "提交反馈"}
          </button>
        </form>
        {feedbackStatus ? <p className="text-sm text-zinc-700">{feedbackStatus}</p> : null}

        <div className="space-y-2">
          <p className="text-sm font-medium">历史反馈</p>
          {item.feedbacks.length === 0 ? (
            <p className="text-sm text-zinc-500">暂无反馈</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {item.feedbacks.map((feedback) => (
                <li key={feedback.id} className="rounded border border-zinc-200 p-2">
                  <p>{feedback.feedbackType}</p>
                  <p className="text-zinc-600">{feedback.note || "-"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
