"use client";

import { useState } from "react";

type Topic = {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  isActive: boolean;
};

type TopicForm = {
  name: string;
  description: string;
  priority: string;
  isActive: boolean;
};

type TopicsClientProps = {
  initialTopics: Topic[];
  initialError?: string;
};

const emptyForm: TopicForm = {
  name: "",
  description: "",
  priority: "50",
  isActive: true,
};

export default function TopicsClient({ initialTopics, initialError }: TopicsClientProps) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(initialError ?? "");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TopicForm>(emptyForm);

  async function loadTopics() {
    setLoading(true);
    const response = await fetch("/api/topics", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "加载失败");
      setLoading(false);
      return;
    }

    setTopics(data.topics as Topic[]);
    setLoading(false);
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    const response = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        priority: Number(form.priority),
        isActive: form.isActive,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "创建失败");
      setCreating(false);
      return;
    }

    setForm(emptyForm);
    setMessage("主题已创建");
    setCreating(false);
    await loadTopics();
  }

  function startEdit(topic: Topic) {
    setEditingId(topic.id);
    setForm({
      name: topic.name,
      description: topic.description ?? "",
      priority: String(topic.priority),
      isActive: topic.isActive,
    });
    setMessage("");
  }

  async function saveEdit() {
    if (!editingId) {
      return;
    }

    const response = await fetch(`/api/topics/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        priority: Number(form.priority),
        isActive: form.isActive,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "更新失败");
      return;
    }

    setEditingId(null);
    setForm(emptyForm);
    setMessage("主题已更新");
    await loadTopics();
  }

  async function toggleActive(topic: Topic) {
    const response = await fetch(`/api/topics/${topic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !topic.isActive }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "切换失败");
      return;
    }

    setMessage("状态已更新");
    await loadTopics();
  }

  async function removeTopic(topicId: string) {
    const response = await fetch(`/api/topics/${topicId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "删除失败");
      return;
    }

    setMessage("主题已删除");
    await loadTopics();
  }

  return (
    <div className="flex w-full flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">关注主题</h1>
        <p className="text-sm text-zinc-600">管理你的关注方向，分析时会读取 active 主题。</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-medium">{editingId ? "编辑主题" : "新增主题"}</h2>
        <form className="space-y-4" onSubmit={submitCreate}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              名称
              <input
                className="rounded border border-zinc-300 px-3 py-2"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              优先级（0-100）
              <input
                className="rounded border border-zinc-300 px-3 py-2"
                type="number"
                min={0}
                max={100}
                value={form.priority}
                onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            描述
            <textarea
              className="min-h-24 rounded border border-zinc-300 px-3 py-2"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            启用主题
          </label>

          {!editingId ? (
            <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-60" disabled={creating} type="submit">
              {creating ? "创建中..." : "创建主题"}
            </button>
          ) : (
            <div className="flex gap-3">
              <button className="rounded bg-black px-4 py-2 text-white" onClick={() => void saveEdit()} type="button">
                保存修改
              </button>
              <button
                className="rounded border border-zinc-300 px-4 py-2"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                type="button"
              >
                取消
              </button>
            </div>
          )}
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium">主题列表</h2>
          <button className="rounded border border-zinc-300 px-3 py-1 text-sm" onClick={() => void loadTopics()} type="button">
            刷新
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-zinc-500">加载中...</p>
        ) : topics.length === 0 ? (
          <p className="text-sm text-zinc-500">暂无主题</p>
        ) : (
          <ul className="space-y-3">
            {topics.map((topic) => (
              <li key={topic.id} className="rounded border border-zinc-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{topic.name}</p>
                    <p className="text-sm text-zinc-500">优先级：{topic.priority} · {topic.isActive ? "启用" : "停用"}</p>
                    {topic.description && <p className="mt-1 text-sm text-zinc-600">{topic.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded border border-zinc-300 px-3 py-1 text-sm" onClick={() => startEdit(topic)} type="button">
                      编辑
                    </button>
                    <button className="rounded border border-zinc-300 px-3 py-1 text-sm" onClick={() => void toggleActive(topic)} type="button">
                      {topic.isActive ? "停用" : "启用"}
                    </button>
                    <button className="rounded border border-red-300 px-3 py-1 text-sm text-red-600" onClick={() => void removeTopic(topic.id)} type="button">
                      删除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && <p className="text-sm text-zinc-700">{message}</p>}
    </div>
  );
}
