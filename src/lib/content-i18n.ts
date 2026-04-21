import type { UILanguage } from '@/components/ui-preference-provider'

const CHINESE_PATTERN = /[\u4e00-\u9fff]/

const EXACT_TRANSLATIONS: Record<string, string> = {
  '页面未找到': 'Page Not Found',
  '您访问的页面不存在或已移动': 'The page you visited does not exist or has moved.',
  '返回首页': 'Back to Home',
  '进入驾驶舱': 'Enter Cockpit',
  '当前未登录，无法访问驾驶舱内容。': 'You are not signed in and cannot access the cockpit.',
  '正在验证登录状态': 'Verifying Sign-In Status',
  '跳转登录中': 'Redirecting to Sign In',
  '前往登录': 'Go to Sign In',
  '使用技巧': 'Usage Tips',
  '安全保障': 'Security Safeguards',
  '决策分级': 'Decision Levels',
  '智能体模型策略': 'Agent Model Strategy',
  '当前角色详情': 'Current Role Details',
  '请输入': 'Please input',
  '刷新': 'Refresh',
  '保存': 'Save',
  '取消': 'Cancel',
  '提交': 'Submit',
  '删除': 'Delete',
  '编辑': 'Edit',
  '查看详情': 'View Details',
  '导出': 'Export',
  '导入': 'Import',
  '上传': 'Upload',
  '下载': 'Download',
  '审批': 'Approval',
  '审核': 'Review',
  '同步': 'Sync',
  '成功': 'Success',
  '失败': 'Failed',
  '警告': 'Warning',
  '错误': 'Error',
  '未知': 'Unknown',
}

const TOKEN_TRANSLATIONS: Array<[string, string]> = [
  ['权限同步 Access Synced', 'Access Synced'],
  ['星座厨房服务集团', 'Star Kitchen Hospitality Group'],
  ['星厨 AI 驾驶舱', 'Star Kitchen AI Cockpit'],
  ['一键切换中英文', 'One-click CN/EN'],
  ['一键切换深色', 'One-click Dark Theme'],
  ['跟随系统', 'System'],
  ['深色', 'Dark'],
  ['浅色', 'Light'],
  ['仪表盘', 'Dashboard'],
  ['行动中心', 'Action Center'],
  ['项目管理', 'Project Management'],
  ['档口分析', 'Counter Analysis'],
  ['经营穿透', 'Business Drilldown'],
  ['人力系统', 'HR System'],
  ['人力总览', 'HR Overview'],
  ['盖雅花名册', 'Gaia Roster'],
  ['项目排班明细', 'Project Scheduling'],
  ['排班优化', 'Shift Optimization'],
  ['缺编追踪', 'Staffing Gap Tracking'],
  ['异常中心', 'Exception Center'],
  ['产品中心', 'Product Center'],
  ['产品总览', 'Product Overview'],
  ['供应链中心', 'Supply Chain Center'],
  ['供应总览', 'Supply Overview'],
  ['采购到货', 'Procurement'],
  ['配送履约', 'Dispatch Fulfillment'],
  ['库存中心', 'Inventory Center'],
  ['库存预警', 'Inventory Alerts'],
  ['食安闭环', 'Food Safety Loop'],
  ['财务分析', 'Finance Analysis'],
  ['报表中心', 'Report Center'],
  ['协同 OA', 'Collaborative OA'],
  ['管理员中心', 'Admin Center'],
  ['系统设置', 'System Settings'],
  ['知识库', 'Knowledge Base'],
  ['系统集成', 'System Integrations'],
  ['帮助中心', 'Help Center'],
  ['模型接入', 'Model Access'],
  ['用户管理', 'User Management'],
  ['登录审计', 'Login Audit'],
  ['治理策略', 'Governance Policy'],
  ['基础设置', 'Basic Settings'],
  ['数据导入', 'Data Imports'],
  ['AI 审批工单', 'AI Workflow Tickets'],
  ['AI 技能中心', 'AI Skill Center'],
  ['AI 集群团队', 'AI Cluster Team'],
  ['可直接对话', 'Direct Chat Allowed'],
  ['直连门槛', 'Direct Access Threshold'],
  ['你的角色', 'Your Role'],
  ['技能', 'Skills'],
  ['知识域', 'Knowledge Domains'],
  ['协同角色', 'Collaboration Roles'],
  ['本月', 'This Month'],
  ['今日', 'Today'],
  ['明日', 'Tomorrow'],
  ['昨日', 'Yesterday'],
  ['当前', 'Current'],
  ['目标', 'Target'],
  ['建议', 'Recommendation'],
  ['行动项', 'Action Items'],
  ['负责人', 'Owner'],
  ['截止时间', 'Deadline'],
  ['来源引用', 'Sources'],
  ['结论', 'Conclusion'],
  ['依据', 'Evidence'],
  ['风险', 'Risk'],
  ['上传失败', 'Upload Failed'],
  ['生成失败', 'Generation Failed'],
  ['请稍后重试', 'Please try again later'],
  ['待处理', 'Pending'],
  ['待确认', 'To Confirm'],
  ['待补货', 'Restock Needed'],
  ['整改中', 'Rectifying'],
  ['已完成', 'Completed'],
  ['已开通', 'Enabled'],
  ['待开通', 'Pending Enablement'],
  ['启用', 'Enabled'],
  ['禁用', 'Disabled'],
  ['可用', 'Available'],
  ['在线', 'Online'],
  ['离线', 'Offline'],
  ['正常', 'Normal'],
  ['异常', 'Abnormal'],
  ['门店', 'Store'],
  ['项目', 'Project'],
  ['城市', 'City'],
  ['区域', 'Region'],
  ['角色', 'Role'],
  ['姓名', 'Name'],
  ['工号', 'Employee ID'],
  ['手机号', 'Mobile'],
  ['用户名', 'Username'],
  ['密码', 'Password'],
  ['成本', 'Cost'],
  ['人力成本', 'Labor Cost'],
  ['食材成本', 'Ingredient Cost'],
  ['收入', 'Revenue'],
  ['营业收入', 'Operating Revenue'],
  ['营业额', 'Turnover'],
  ['毛利', 'Gross Profit'],
  ['毛利率', 'Gross Margin'],
  ['净利率', 'Net Margin'],
  ['损耗率', 'Waste Rate'],
  ['预算', 'Budget'],
  ['班次', 'Shift'],
  ['在岗', 'On Duty'],
  ['离岗', 'Off Duty'],
  ['休假', 'On Leave'],
  ['岗位', 'Position'],
  ['审计', 'Audit'],
  ['文件', 'Files'],
  ['会议', 'Meetings'],
  ['通话', 'Calls'],
  ['群聊', 'Group Chat'],
  ['私聊', 'Direct Message'],
  ['分钟', 'min'],
  ['小时', 'h'],
  ['万元', '10k CNY'],
  ['中国', 'China'],
  ['北京', 'Beijing'],
  ['上海', 'Shanghai'],
  ['苏州', 'Suzhou'],
  ['无锡', 'Wuxi'],
  ['华东', 'East China'],
  ['鄂尔多斯', 'Ordos'],
  ['十堰', 'Shiyan'],
  ['大连', 'Dalian'],
  ['林总', 'Mr. Lin'],
  ['诸葛亮', 'Zhuge Liang'],
  ['舒尔茨', 'Schultz'],
  ['雷克罗克', 'Ray Kroc'],
  ['盖雅', 'Gaia'],
  ['供应商', 'Supplier'],
  ['运营总监', 'Operations Director'],
  ['运营经理', 'Operations Manager'],
  ['优先级', 'Priority'],
  ['模型', 'Model'],
  ['能力', 'Capabilities'],
  ['其它', 'Others'],
]

const sortedTokenTranslations = [...TOKEN_TRANSLATIONS].sort((a, b) => b[0].length - a[0].length)

const normalizePunctuation = (value: string) =>
  value
    .replace(/：/g, ': ')
    .replace(/，/g, ', ')
    .replace(/。/g, '. ')
    .replace(/；/g, '; ')
    .replace(/（/g, ' (')
    .replace(/）/g, ')')
    .replace(/、/g, ' / ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim()

const extractBodyText = (value: string) => {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/)
  if (!match) return { leading: '', body: value, trailing: '' }
  return { leading: match[1], body: match[2], trailing: match[3] }
}

const translateByExact = (body: string) => EXACT_TRANSLATIONS[body.trim()] || null

const translateByTokens = (body: string) => {
  let next = body
  for (const [zh, en] of sortedTokenTranslations) {
    if (!next.includes(zh)) continue
    next = next.split(zh).join(en)
  }
  return next
}

export const translateContentText = (value: string, language: UILanguage) => {
  if (!value || language === 'zh') return value
  if (!CHINESE_PATTERN.test(value)) return value

  const { leading, body, trailing } = extractBodyText(value)
  const exact = translateByExact(body)
  const translated = exact || translateByTokens(body)
  const cleaned = normalizePunctuation(translated)
  return `${leading}${cleaned}${trailing}`
}
