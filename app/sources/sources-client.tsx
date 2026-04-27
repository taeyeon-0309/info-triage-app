"use client";

import { useState } from "react";

type SourceItem = {
  id: string;
  name: string;
  platform: string;
  url: string | null;
  qualityScore: number;
  isBlocked: boolean;
  _count: { contentItems: number };
};

export default function SourcesClient({
  initialSources,
  initialError,
}: {
  initialSources: SourceItem[];
  initialError?: string;
}) {
  const [sources, setSources] = useState(initialSources);
  const [message, setMessage] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);

  async function loadSources() {
    setLoading(true);
    const response = await fetch("/api/sources", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "加载失败");
      setLoading(false);
      return;
    }
    setSources(data.sources as SourceItem[]);
    setLoading(false);
  }

  async function patchSource(id: string, body: { qualityScore?: number; isBlocked?: boolean }) {
    const response = await fetch(`/api/sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error ?? "更新失败");
      return;
    }
    setMessage("来源已更新");
    await loadSources();
  }

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">来源管理</h1>
        <p className="text-sm text-zinc-600">调整来源质量，拉黑或恢复来源。</p>
      </header>

      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium">来源列表</h2>
          <button className="rounded border border-zinc-300 px-3 py-1 text-sm" onClick={() => void loadSources()} type="button">
            刷新
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-zinc-500">加载中...</p>
        ) : sources.length === 0 ? (
          <p className="text-sm text-zinc-500">暂无来源</p>
        ) : (
          <ul className="space-y-3">
            {sources.map((source) => (
              <li key={source.id} className="rounded border border-zinc-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-sm text-zinc-500">
                      {source.platform} · 质量 {source.qualityScore} · 内容 {source._count.contentItems} · {source.isBlocked ? "已拉黑" : "正常"}
                    </p>
                    {source.url ? <p className="mt-1 text-sm text-zinc-600">{source.url}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded border border-zinc-300 px-3 py-1 text-sm"
                      onClick={() => void patchSource(source.id, { qualityScore: Math.min(100, source.qualityScore + 10) })}
                      type="button"
                    >
                      提高质量
                    </button>
                    <button
                      className="rounded border border-zinc-300 px-3 py-1 text-sm"
                      onClick={() => void patchSource(source.id, { qualityScore: Math.max(0, source.qualityScore - 10) })}
                      type="button"
                    >
                      降低质量
                    </button>
                    <button
                      className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
                      onClick={() => void patchSource(source.id, { isBlocked: !source.isBlocked })}
                      type="button"
                    >
                      {source.isBlocked ? "恢复" : "拉黑"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
