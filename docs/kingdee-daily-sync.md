# 金蝶云星空 → 星厨驾驶舱（每日自动导入）

## 1. 数据链路

1. `Vercel Cron` 每日触发 `GET /api/finance/live/sync`
2. 同步接口校验 `CRON_SECRET / FINANCE_LIVE_CRON_TOKEN / FINANCE_LIVE_INGEST_TOKEN`
3. 后端走 `kingdee-k3cloud` provider：
   - `AuthService.LoginByAppSecret.common.kdsvc` 获取会话
   - `DynamicFormService.ExecuteBillQuery.common.kdsvc` 拉取财务行数据
4. 映射为驾驶舱统一口径（scope + metrics）并写入实时存储
5. 仪表盘与财务页面读取 `/api/finance/live` 最新数据

## 2. 必填环境变量

```bash
FINANCE_LIVE_PULL_PROVIDER=kingdee-k3cloud

KINGDEE_K3CLOUD_BASE_URL=https://xxx
KINGDEE_K3CLOUD_ACCT_ID=...
KINGDEE_K3CLOUD_USERNAME=...
KINGDEE_K3CLOUD_APP_ID=...
KINGDEE_K3CLOUD_APP_SECRET=...
KINGDEE_K3CLOUD_FORM_ID=...

# 至少包含一个指标字段，建议显式配置
KINGDEE_K3CLOUD_FIELD_KEYS=FScopePath,FOrgNumber,FRevenue,FFoodCost,FLaborCost,FOperatingProfit

# 同步触发令牌（至少配置一种）
CRON_SECRET=...
# 或
FINANCE_LIVE_CRON_TOKEN=...
FINANCE_LIVE_INGEST_TOKEN=...
```

## 3. 推荐可选变量

```bash
# 指标字段映射（优先于候选字段）
KINGDEE_K3CLOUD_METRIC_MAP_JSON={"revenue":"FRevenue","food-cost":"FFoodCost","labor-cost":"FLaborCost","operating-profit":"FOperatingProfit"}

# 组织编码到项目路径映射（当源数据没有 FScopePath 时）
KINGDEE_K3CLOUD_SCOPE_MAP_JSON={"ORG001":["global","china","east-china","shanghai","project-a"]}

KINGDEE_K3CLOUD_SCOPE_FIELD=FScopePath
KINGDEE_K3CLOUD_ORG_FIELD=FOrgNumber
KINGDEE_K3CLOUD_FILTER_STRING=
KINGDEE_K3CLOUD_ORDER_STRING=
KINGDEE_K3CLOUD_LIMIT=500
KINGDEE_K3CLOUD_TIMEOUT_MS=20000

# 重试配置（网络抖动时）
KINGDEE_K3CLOUD_RETRY_ATTEMPTS=2
KINGDEE_K3CLOUD_RETRY_DELAY_MS=600
```

## 4. 定时任务配置

`vercel.json` 已包含：

```json
{
  "crons": [
    { "path": "/api/finance/live/sync", "schedule": "0 2 * * *" }
  ]
}
```

说明：
- Vercel Cron 使用 **UTC**，`0 2 * * *` 等于北京时间每天 **10:00**。
- 如需改为北京时间凌晨 02:00，可调整为 `0 18 * * *`（UTC 前一天 18:00）。

## 5. 上线与验收

1. 在 Vercel 设置上述环境变量并重新部署。
2. 手工验证连接：
   - `GET /api/integrations/kingdee/test`
3. 手工触发一次同步：
   - `GET /api/finance/live/sync`（带授权 token）
4. 校验健康状态：
   - `GET /api/finance/live/health`
   - `GET /api/integrations/status`
5. 仪表盘确认指标是否变为 `live` 模式。

## 6. 常见问题

- 报错“字段映射不完整”：
  - 需补齐 `KINGDEE_K3CLOUD_FIELD_KEYS` 或 `KINGDEE_K3CLOUD_METRIC_MAP_JSON`。
- 报错 401：
  - 检查 `CRON_SECRET` / `FINANCE_LIVE_*_TOKEN` 与请求头是否一致。
- 拉取成功但无指标：
  - 检查 `FieldKeys` 是否包含真实财务字段，或补齐 `METRIC_MAP_JSON`。

## 7. 官方参考

- [金蝶云星空开放平台](https://open.kingdee.com/K3Cloud/Open/ApiCenterReportDetail.aspx)
- [金蝶 OpenAPI 文档入口](https://openapi.open.kingdee.com/ApiDoc)
