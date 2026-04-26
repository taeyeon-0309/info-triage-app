import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

type LibrarySearchParams = {
  platform?: string;
  recommendedAction?: string;
  topic?: string;
  readStatus?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  page?: string;
  pageSize?: string;
};

function buildQuery(searchParams: LibrarySearchParams) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      query.set(key, value);
    }
  }

  return query.toString();
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<LibrarySearchParams>;
}) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <div className="w-full px-6 py-10">
        <h1 className="text-3xl font-semibold">内容库</h1>
        <p className="mt-3 text-sm text-zinc-600">请先登录后查看内容库。</p>
      </div>
    );
  }

  const params = await searchParams;

  const where = {
    userId,
    ...(params.platform ? { platform: params.platform as never } : {}),
    ...(params.readStatus ? { readStatus: params.readStatus as never } : {}),
    ...(params.fromDate || params.toDate
      ? {
          submittedAt: {
            ...(params.fromDate ? { gte: new Date(params.fromDate) } : {}),
            ...(params.toDate ? { lte: new Date(params.toDate) } : {}),
          },
        }
      : {}),
  };

  const page = Number(params.page ?? "1") || 1;
  const pageSize = Number(params.pageSize ?? "20") || 20;

  const [total, items] = await Promise.all([
    db.contentItem.count({ where }),
    db.contentItem.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        platform: true,
        status: true,
        readStatus: true,
        submittedAt: true,
        isUrlOnly: true,
        analyses: {
          where: { isCurrent: true },
          take: 1,
          select: {
            recommendedAction: true,
            readingValueScore: true,
            topicTags: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">内容库</h1>
        <p className="text-sm text-zinc-600">按平台、动作、主题和时间筛选已提交内容。</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <form className="grid gap-3 md:grid-cols-4" method="GET">
          <input className="rounded border border-zinc-300 px-3 py-2" name="platform" placeholder="platform" defaultValue={params.platform ?? ""} />
          <input className="rounded border border-zinc-300 px-3 py-2" name="recommendedAction" placeholder="recommendedAction" defaultValue={params.recommendedAction ?? ""} />
          <input className="rounded border border-zinc-300 px-3 py-2" name="topic" placeholder="topic" defaultValue={params.topic ?? ""} />
          <input className="rounded border border-zinc-300 px-3 py-2" name="readStatus" placeholder="readStatus" defaultValue={params.readStatus ?? ""} />
          <input className="rounded border border-zinc-300 px-3 py-2" name="fromDate" type="date" defaultValue={params.fromDate ?? ""} />
          <input className="rounded border border-zinc-300 px-3 py-2" name="toDate" type="date" defaultValue={params.toDate ?? ""} />
          <select className="rounded border border-zinc-300 px-3 py-2" name="sortBy" defaultValue={params.sortBy ?? "submittedAt"}>
            <option value="submittedAt">submittedAt</option>
            <option value="readingValue">readingValue</option>
          </select>
          <input className="rounded border border-zinc-300 px-3 py-2" name="pageSize" type="number" min={1} max={100} defaultValue={params.pageSize ?? "20"} />
          <button className="rounded bg-black px-4 py-2 text-white md:col-span-4" type="submit">
            应用筛选
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="mb-3 text-sm text-zinc-500">共 {total} 条，当前第 {page} / {totalPages} 页</p>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">暂无内容</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const current = item.analyses[0];

              return (
                <li key={item.id} className="rounded border border-zinc-200 p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-zinc-500">
                      {item.platform} · {item.status} · {item.readStatus}
                    </p>
                    <p className="text-sm text-zinc-600">
                      action: {current?.recommendedAction ?? "-"} · score: {current?.readingValueScore ?? "-"} · urlOnly: {item.isUrlOnly ? "yes" : "no"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex items-center gap-2">
        {page > 1 ? (
          <a
            className="rounded border border-zinc-300 px-3 py-1 text-sm"
            href={`/library?${buildQuery({ ...params, page: String(page - 1) })}`}
          >
            上一页
          </a>
        ) : null}
        {page < totalPages ? (
          <a
            className="rounded border border-zinc-300 px-3 py-1 text-sm"
            href={`/library?${buildQuery({ ...params, page: String(page + 1) })}`}
          >
            下一页
          </a>
        ) : null}
      </section>
    </div>
  );
}
