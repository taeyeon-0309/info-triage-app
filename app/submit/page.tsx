"use client";

import { useMemo, useState } from "react";
import { sourcePlatforms, type SourcePlatform } from "@/lib/constants/platform";

type SubmitResult = {
  contentItemId: string;
  status: string;
  isUrlOnly: boolean;
};

type BatchResult = {
  successCount: number;
  failedCount: number;
  successes: SubmitResult[];
  failures: Array<{ index: number; error: string }>;
};

const platformOptions = [...sourcePlatforms];

function parseBatchText(input: string, defaultPlatform: SourcePlatform) {
  return input
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const title = lines[0]?.replace(/^\d+\.\s*/, "") || undefined;
      const urlLine = lines.find((line) => /^https?:\/\//i.test(line));
      const body = lines.filter((line) => line !== urlLine && line !== lines[0]).join("\n");

      return {
        title,
        url: urlLine,
        rawText: body || undefined,
        platform: defaultPlatform,
      };
    });
}

export default function SubmitPage() {
  const [platform, setPlatform] = useState<SourcePlatform>("WEBSITE");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [singleMessage, setSingleMessage] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [batchMessage, setBatchMessage] = useState("");
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const batchPreviewCount = useMemo(() => parseBatchText(batchInput, platform).length, [batchInput, platform]);

  async function handleSingleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingSingle(true);
    setSingleMessage("");

    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, rawText, platform, author, note }),
    });

    const data = await response.json();

    if (!response.ok) {
      setSingleMessage(data.error ?? "提交失败");
      setSubmittingSingle(false);
      return;
    }

    setSingleMessage(`提交成功：${data.contentItemId} (${data.isUrlOnly ? "URL-only" : "可分析"})`);
    setTitle("");
    setUrl("");
    setRawText("");
    setAuthor("");
    setNote("");
    setSubmittingSingle(false);
  }

  async function handleBatchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingBatch(true);
    setBatchMessage("");
    setBatchResult(null);

    const items = parseBatchText(batchInput, platform);

    const response = await fetch("/api/content/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = (await response.json()) as BatchResult | { error?: string };

    if (!response.ok) {
      setBatchMessage((data as { error?: string }).error ?? "批量提交失败");
      setSubmittingBatch(false);
      return;
    }

    setBatchResult(data as BatchResult);
    setBatchMessage("批量提交完成");
    setBatchInput("");
    setSubmittingBatch(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">提交内容</h1>
        <p className="text-sm text-zinc-600">支持单条提交与批量提交。url 与 rawText 至少填写一个。</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-medium">单条提交</h2>
        <form className="space-y-4" onSubmit={handleSingleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              标题（可选）
              <input className="rounded border border-zinc-300 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              平台
              <select className="rounded border border-zinc-300 px-3 py-2" value={platform} onChange={(e) => setPlatform(e.target.value as SourcePlatform)}>
                {platformOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            URL（可选）
            <input className="rounded border border-zinc-300 px-3 py-2" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            正文文本（可选）
            <textarea className="min-h-28 rounded border border-zinc-300 px-3 py-2" value={rawText} onChange={(e) => setRawText(e.target.value)} />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              作者（可选）
              <input className="rounded border border-zinc-300 px-3 py-2" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              备注（可选）
              <input className="rounded border border-zinc-300 px-3 py-2" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>

          <button disabled={submittingSingle} className="rounded bg-black px-4 py-2 text-white disabled:opacity-60" type="submit">
            {submittingSingle ? "提交中..." : "提交单条内容"}
          </button>
        </form>
        {singleMessage && <p className="mt-3 text-sm text-zinc-700">{singleMessage}</p>}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-medium">批量提交</h2>
        <form className="space-y-4" onSubmit={handleBatchSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            粘贴文本（空行分隔多条）
            <textarea
              className="min-h-48 rounded border border-zinc-300 px-3 py-2"
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder={"1. 标题\nhttps://example.com\n正文摘要\n\n2. 标题\nhttps://example.com/2\n正文摘要"}
            />
          </label>

          <p className="text-xs text-zinc-500">预计识别 {batchPreviewCount} 条。</p>

          <button disabled={submittingBatch} className="rounded bg-zinc-800 px-4 py-2 text-white disabled:opacity-60" type="submit">
            {submittingBatch ? "提交中..." : "批量提交"}
          </button>
        </form>

        {batchMessage && <p className="mt-3 text-sm text-zinc-700">{batchMessage}</p>}
        {batchResult && (
          <div className="mt-4 space-y-2 text-sm">
            <p>成功 {batchResult.successCount} 条，失败 {batchResult.failedCount} 条。</p>
            {batchResult.failures.length > 0 && (
              <ul className="list-disc pl-5 text-red-600">
                {batchResult.failures.map((failure) => (
                  <li key={`${failure.index}-${failure.error}`}>第 {failure.index + 1} 条：{failure.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
