import { ContentStatus, Prisma, RecommendedAction } from "@prisma/client";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { buildDailyReportPayload, formatShanghaiDate, getShanghaiDayWindow } from "@/lib/reports/daily";

type HomeItem = Prisma.ContentItemGetPayload<{
  include: {
    analyses: true;
  };
}>;

export default async function Home() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <div className="flex w-full flex-col gap-6 px-6 py-10">
        <h1 className="text-3xl font-semibold">今日分诊台</h1>
        <p className="text-zinc-600">请先登录后查看今日分诊结果。</p>
      </div>
    );
  }

  const today = formatShanghaiDate();
  const window = getShanghaiDayWindow(today);

  const items = window
    ? await db.contentItem.findMany({
        where: {
          userId,
          status: ContentStatus.ANALYZED,
          isUrlOnly: false,
          submittedAt: {
            gte: window.start,
            lt: window.end,
          },
        },
        orderBy: { submittedAt: "desc" },
        include: {
          analyses: {
            where: { isCurrent: true },
            take: 1,
          },
        },
      })
    : [];

  const report = buildDailyReportPayload(items);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const mustRead = report.mustReadItemIds
    .map((id) => itemById.get(id))
    .filter((item): item is HomeItem => Boolean(item));
  const skim = report.skimItemIds
    .map((id) => itemById.get(id))
    .filter((item): item is HomeItem => Boolean(item));
  const skipped = report.skippedItemIds
    .map((id) => itemById.get(id))
    .filter((item): item is HomeItem => Boolean(item));

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">今日分诊台</h1>
        <p className="text-sm text-zinc-600">{report.summary}</p>
        <div>
          <Link className="inline-flex rounded bg-black px-4 py-2 text-sm text-white" href="/submit">
            新增内容
          </Link>
        </div>
      </header>

      <TriageSection title="今日必须读" items={mustRead} empty="暂无必须精读内容" />
      <TriageSection title="今日略读" items={skim} empty="暂无略读内容" />

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-xl font-medium">值得追踪的主题</h2>
        {report.trackedTopics.length === 0 ? (
          <p className="text-sm text-zinc-500">暂无追踪主题</p>
        ) : (
          <p className="text-sm text-zinc-700">{report.trackedTopics.join("、")}</p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-xl font-medium">今日异常信号</h2>
        {report.anomalySignals.length === 0 ? (
          <p className="text-sm text-zinc-500">暂无异常信号</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {report.anomalySignals.map((signal) => (
              <li key={signal.title} className="rounded border border-zinc-200 p-3">
                <p className="font-medium">{signal.title}</p>
                <p className="text-zinc-600">{signal.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="rounded-xl border border-zinc-200 bg-white p-4">
        <summary className="cursor-pointer text-xl font-medium">建议跳过</summary>
        <div className="mt-3">
          <TriageList items={skipped} empty="暂无建议跳过内容" />
        </div>
      </details>
    </div>
  );
}

function TriageSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: HomeItem[];
  empty: string;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-xl font-medium">{title}</h2>
      <TriageList items={items} empty={empty} />
    </section>
  );
}

function TriageList({
  items,
  empty,
}: {
  items: HomeItem[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const analysis = item.analyses[0];
        return (
          <li key={item.id} className="rounded border border-zinc-200 p-4">
            <Link className="font-medium hover:underline" href={`/content/${item.id}`}>
              {item.title}
            </Link>
            <p className="mt-1 text-sm text-zinc-500">
              {item.platform} · {analysis?.recommendedAction ?? RecommendedAction.SKIP} · 阅读价值 {analysis?.readingValueScore ?? "-"}
            </p>
            <p className="mt-2 text-sm text-zinc-700">
              {(analysis?.recommendationReasons ?? analysis?.skipReasons ?? []).slice(0, 3).join("；") || analysis?.coreSummary || "暂无理由"}
            </p>
            {item.url ? (
              <a className="mt-2 inline-flex text-sm text-blue-600 hover:underline" href={item.url} rel="noreferrer" target="_blank">
                原文链接
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
