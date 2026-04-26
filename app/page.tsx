import Link from "next/link";

export default function Home() {
  return (
    <div className="flex w-full flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold">今日分诊台（MVP 初始化）</h1>
      <p className="text-zinc-600">
        当前已开启第 1-3 步开发，先完成内容提交、存储与分析前置状态。
      </p>
      <div>
        <Link className="inline-flex rounded bg-black px-4 py-2 text-white" href="/submit">
          去提交内容
        </Link>
      </div>
    </div>
  );
}
