<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


<claude-mem-context>
# Memory Context

# [info-triage-app] recent context, 2026-04-26 9:42pm GMT+8

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 25 obs (3,116t read) | 0t work

### Apr 26, 2026
335 5:35p 🔵 using-superpowers 技能的强制调用规则与优先级被确认
388 5:36p 🔵 GitHub 总控 skill 的路由与执行边界被确认
389 " 🔵 当前工作目录缺失 Git 仓库上下文
390 5:52p 🟣 内容提交链路已形成“前端录入+后端鉴权校验+仓储写入”闭环
391 " 🔵 Prisma 数据模型已覆盖分诊分析、反馈与日报核心实体
392 " 🔵 项目运行基线已具备测试与种子命令，但文档仍处模板阶段
396 5:53p 🔵 本地质量门禁通过但生产构建被字体拉取失败阻断
397 " 🔵 Next.js 文档约束确认了 Supabase Cookie 鉴权的运行时边界
401 5:54p 🔵 单条提交存在前后端契约错位导致误判校验失败
402 " 🔵 构建根目录告警来源已定位为父级多锁文件与未配置 turbopack.root
435 6:14p 🔵 提交页将空字符串作为可选字段提交导致 400
436 " 🔵 Supabase 用户标识与 Prisma User 主键模型不一致
437 " 🔵 批量入库仅处理校验失败，数据库异常会整批中断
438 " 🔵 用户备注被复用到 summary 字段引发语义污染
439 " 🔵 生产构建受 Google Fonts 在线下载依赖影响
440 " 🔵 Turbopack 工作区根目录被错误上探到用户主目录
441 6:15p 🔵 生产构建失败已复现并定位到 Google Fonts 拉取依赖
442 " 🔵 Turbopack 根目录误判条件被构建日志确认
443 " 🔵 单条提交空字符串校验陷阱与测试缺口被再次确认
444 " 🔵 内容入库链路的身份映射与批量容错风险被代码级复核
455 6:18p 🔵 二次复核确认关键提交链路风险仍未修复
456 " 🔵 现有测试基线未覆盖高风险失败路径
582 9:31p 🔵 二次代码审查确认 6 个高优先问题仍未修复
586 " 🔵 确认 Next.js 16 动态 Route Handler 采用 Promise params 约定
587 " 🔵 zsh 下未转义动态路由方括号会导致读取命令失败
</claude-mem-context>

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.