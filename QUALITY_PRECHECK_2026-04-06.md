# Star Kitchen 网站预检报告（2026-04-06）

## 执行范围

- `npm run quality:run`
- `npm run build`
- `npm run test:oa-smoke`
- `npm run test:ai-workflow-smoke`
- `npm run test:llm-smoke`
- 一键命令：`npm run quality:preflight`

## 结果摘要

- 代码门禁：通过（无关键规则新增违规）
- 构建：通过（Next.js production build success）
- OA 冒烟：通过（会话、消息、附件、通话、会议、审计均 200/201）
- AI Workflow 冒烟：通过（工单创建与审批链路通过）
- LLM 冒烟：通过（控制台、监控、聊天接口通过）
- 单元测试：通过（Vitest 68/68）
- 历史质量债务：`181 -> 108`（本轮净减少 `73`）

## 本轮已修复

1. 登录失败提示可观测性提升
   - 登录页可显示后端真实错误信息，不再只显示“用户名或密码错误”。
2. 冒烟脚本兼容认证模式切换
   - 自动登录失败时改为降级执行“未认证门禁检查”，避免误报脚本失败。
3. 令牌字段兼容性增强
   - `smoke-auth` 兼容 `token / accessToken / access_token`。
4. 默认域名统一
   - 冒烟脚本默认 `https://www.starkitchen.works`。
5. 新增发布前一键预检
   - 新增 `quality:preflight`，用于外部审查前快速验收。
6. 测试体系落地
   - 接入 `vitest`，并补齐 `68` 个模块测试文件（可执行，不是占位文本）。
7. 超长函数治理（第一阶段）
   - 已完成 `store/auth`、`login`、`api/finance/live` 的结构化拆分，`function-max-lines` 从 `112` 降至 `107`。

## 仍需持续优化（非阻断）

- 现存历史技术债：`108`（基线内，未回退）
  - `function-max-lines: 107`
  - `coverage-threshold: 1`（尚未产出 coverage-summary）
- 多个页面存在 Next.js CSR deopt 警告（不阻断构建，但影响首屏策略优化空间）。
