# 代码质量审查报告（2026-04-06）

## 审查基线

- 审查命令：`npm run quality:check`
- 自动清理命令：`npm run quality:fix`
- 综合门禁命令：`npm run quality:run`

## 本轮结果

- 总问题数：`180`
- 规则命中：`3`

### 1) 函数长度超标（>50 行）

- 问题数：`112`
- 典型超标文件：
  - `src/components/sidebar.tsx`
  - `src/components/header.tsx`
  - `src/app/dashboard/chat/page.tsx`
  - `src/app/dashboard/finance/[metric]/metric-detail-client.tsx`
  - `src/app/dashboard/finance/drilldown/[...scope]/drilldown-scope-client.tsx`

### 2) 模块缺少单元测试

- 问题数：`67`
- 范围：`src/lib/**`、`src/store/**`、`src/app/api/**/route.ts`

### 3) 覆盖率门禁

- 问题数：`1`
- 当前状态：缺失 `coverage/coverage-summary.json`
- 说明：尚未建立可执行的覆盖率产物，因此无法判断是否达到 `>80%`

## 本轮已完成修复

### 外部输入验证（Zod）已补齐（从 18 降至 0）

已在以下接口接入 Zod 校验：

- `src/app/api/auth/login/route.ts`
- `src/app/api/chat/completions/route.ts`
- `src/app/api/finance/live/route.ts`
- `src/app/api/oa/audit/route.ts`
- `src/app/api/oa/calls/route.ts`
- `src/app/api/oa/chat/messages/route.ts`
- `src/app/api/oa/chat/rooms/route.ts`
- `src/app/api/oa/files/route.ts`
- `src/app/api/oa/meetings/route.ts`
- `src/app/api/ai/workflows/route.ts`
- `src/app/api/ai/workflows/[taskId]/route.ts`
- `src/app/api/ai/media/generate/route.ts`
- `src/app/api/llm/routes/route.ts`
- `src/app/api/llm/providers/[providerId]/route.ts`
- `src/app/api/llm/providers/[providerId]/test/route.ts`
- `src/app/api/llm/audit/route.ts`
- `src/app/api/llm/monitor/summary/route.ts`
- `src/app/api/recipe-skill/generate/route.ts`

## 自动审查能力（已落地）

- `scripts/quality-lib.cjs`
- `scripts/quality-check.cjs`
- `scripts/quality-fix.cjs`

能力包括：

- 函数长度检查（>50 行）
- 调试语句检查（`console.log/debug/info`、`print`）
- 过期 TODO/FIXME/XXX 检查（超过 24h 视为违规）
- 注释代码检测
- 外部输入 Zod 校验检查
- 模块测试文件存在性检查
- 覆盖率阈值检查（>80%）
- 密钥/敏感字面量扫描

## 下一阶段建议（按优先级）

1. 先拆分 20 个最长函数（覆盖核心业务页与 API 逻辑）
2. 补齐 `src/lib/server/**` 与 `src/app/api/**` 单测
3. 建立覆盖率产物并开启 `>80%` 硬门禁
4. 将 `npm run quality:run` 接入 CI（PR 必须通过）
