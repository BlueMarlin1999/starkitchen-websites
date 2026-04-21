import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { RecipeSkillRecord } from '@/lib/server/recipe-skill/types'

interface ExportArtifact {
  fileName: string
  mimeType: string
  buffer: Buffer
}

const BRAND_NAME = (process.env.BRAND_NAME || '星厨').trim() || '星厨'

const money = (value: number) => `¥${Number(value || 0).toFixed(2)}`
const percent = (value: number) => `${(Number(value || 0) * 100).toFixed(2)}%`

const buildWordParagraph = (text: string, bold = false) =>
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, bold, font: 'Microsoft YaHei' })],
  })

const buildWordTableCell = (text: string, bold = false) =>
  new TableCell({
    width: { size: 12, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, font: 'Microsoft YaHei' })],
      }),
    ],
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D9E3FF' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D9E3FF' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'D9E3FF' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D9E3FF' },
    },
  })

export const buildWordArtifact = async (record: RecipeSkillRecord): Promise<ExportArtifact> => {
  const recipe = record.recipeJson
  const ingredientHeader = [
    '原料',
    '分类',
    '毛重(g)',
    '净重(g)',
    '损耗率',
    '单价',
    '成本',
    '规格',
  ]
  const ingredientRows = recipe.ingredients.map(
    (item) =>
      new TableRow({
        children: [
          buildWordTableCell(item.name),
          buildWordTableCell(item.category),
          buildWordTableCell(item.gross_weight.toString()),
          buildWordTableCell(item.net_weight.toString()),
          buildWordTableCell(percent(item.loss_rate)),
          buildWordTableCell(money(item.unit_price)),
          buildWordTableCell(money(item.cost)),
          buildWordTableCell(item.spec),
        ],
      })
  )

  const ingredientTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ingredientHeader.map((title) => buildWordTableCell(title, true)),
      }),
      ...ingredientRows,
    ],
  })

  const processRows = recipe.process_steps.map((step) =>
    buildWordParagraph(
      `${step.step_no}. ${step.action}\n说明：${step.detail}\n温度：${step.temperature}  时间：${step.duration}  设备：${step.equipment}\n关键控制点：${step.key_control_point}`
    )
  )

  const document = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${BRAND_NAME} · 标准菜谱 · ${record.version}`,
                    size: 20,
                    color: '2C4A8A',
                    font: 'Microsoft YaHei',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${BRAND_NAME} · 内部资料 · 未经授权禁止外传`,
                    size: 16,
                    color: '6B7280',
                    font: 'Microsoft YaHei',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: recipe.recipe_meta.recipe_name, font: 'Microsoft YaHei' })],
          }),
          buildWordParagraph(
            `基本信息：菜系 ${recipe.recipe_meta.cuisine} ｜ 出品量 ${recipe.recipe_meta.servings} ｜ 备料 ${recipe.recipe_meta.prep_time_minutes} 分钟 ｜ 烹饪 ${recipe.recipe_meta.cook_time_minutes} 分钟 ｜ 难度 ${recipe.recipe_meta.difficulty}`,
            true
          ),
          buildWordParagraph(`过敏原：${recipe.recipe_meta.allergens.join('、') || '无'}`),
          buildWordParagraph(`菜品描述：${recipe.menu_copy.description}`),
          buildWordParagraph(`卖点：${recipe.menu_copy.selling_points.join('；')}`),
          buildWordParagraph('原料配方表', true),
          ingredientTable,
          buildWordParagraph('操作工艺', true),
          ...processRows,
          buildWordParagraph('食品安全与质量标准', true),
          buildWordParagraph(`食品安全：${recipe.sop.food_safety.join('；')}`),
          buildWordParagraph(`摆盘标准：${recipe.sop.plating_standard}`),
          buildWordParagraph(`保质期：${recipe.sop.shelf_life}`),
          buildWordParagraph(`储存方式：${recipe.sop.storage}`),
          buildWordParagraph(`门店执行备注：${recipe.sop.execution_notes}`),
          buildWordParagraph('成本信息', true),
          buildWordParagraph(
            `原料成本 ${money(recipe.costing.total_material_cost)} ｜ 包装 ${money(recipe.costing.packaging_cost)} ｜ 人力 ${money(recipe.costing.labor_cost)} ｜ 其它 ${money(recipe.costing.other_cost)}`
          ),
          buildWordParagraph(
            `总成本 ${money(recipe.costing.total_cost)} ｜ 建议售价 ${money(recipe.costing.suggested_price)} ｜ 成本率 ${percent(recipe.costing.cost_rate)} ｜ 毛利率 ${percent(recipe.costing.gross_margin_rate)}`
          ),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(document)
  return {
    fileName: `${record.name}-标准菜谱.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer,
  }
}

const autoSizeColumns = (rows: (string | number)[][]) => {
  const widths: { wch: number }[] = []
  rows.forEach((row) => {
    row.forEach((value, index) => {
      const text = typeof value === 'number' ? value.toString() : value || ''
      const nextWidth = Math.max(10, Math.min(48, text.length + 2))
      widths[index] = { wch: Math.max(widths[index]?.wch || 0, nextWidth) }
    })
  })
  return widths
}

export const buildExcelArtifact = async (record: RecipeSkillRecord): Promise<ExportArtifact> => {
  const recipe = record.recipeJson
  const workbook = XLSX.utils.book_new()

  const formulaRows: (string | number)[][] = [
    [`${recipe.recipe_meta.recipe_name} 标准配方卡`],
    [
      `菜系:${recipe.recipe_meta.cuisine}`,
      `出品量:${recipe.recipe_meta.servings}`,
      `版本:${recipe.recipe_meta.version}`,
      `日期:${record.createdAt.slice(0, 10)}`,
    ],
    ['序号', '原料', '分类', '毛重(g)', '净重(g)', '损耗率', '单价', '成本', '规格'],
    ...recipe.ingredients.map((item, index) => [
      index + 1,
      item.name,
      item.category,
      item.gross_weight,
      item.net_weight,
      item.loss_rate,
      item.unit_price,
      item.cost,
      item.spec,
    ]),
  ]
  const ingredientCostTotal = Number(
    recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.cost, 0).toFixed(2)
  )
  formulaRows.push(['', '', '', '', '', '', '合计', ingredientCostTotal, ''])
  formulaRows.push([
    '原料总成本',
    recipe.costing.total_material_cost,
    '包装成本',
    recipe.costing.packaging_cost,
    '总成本',
    recipe.costing.total_cost,
    '建议售价',
    recipe.costing.suggested_price,
    '',
  ])
  formulaRows.push([
    '成本率',
    recipe.costing.cost_rate,
    '毛利率',
    recipe.costing.gross_margin_rate,
    '',
    '',
    '',
    '',
    '',
  ])

  const formulaSheet = XLSX.utils.aoa_to_sheet(formulaRows)
  formulaSheet['!cols'] = autoSizeColumns(formulaRows)
  XLSX.utils.book_append_sheet(workbook, formulaSheet, '标准配方卡')

  const sopRows: (string | number)[][] = [
    [`${recipe.recipe_meta.recipe_name} 操作工艺 SOP`],
    ['步骤', '操作', '详细说明', '温度', '时间', '设备', '关键控制点'],
    ...recipe.process_steps.map((step) => [
      step.step_no,
      step.action,
      step.detail,
      step.temperature,
      step.duration,
      step.equipment,
      step.key_control_point,
    ]),
  ]
  const sopSheet = XLSX.utils.aoa_to_sheet(sopRows)
  sopSheet['!cols'] = autoSizeColumns(sopRows)
  XLSX.utils.book_append_sheet(workbook, sopSheet, '操作工艺SOP')

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer
  return {
    fileName: `${record.name}-配方卡.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer,
  }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const buildPdfHtmlArtifact = async (record: RecipeSkillRecord): Promise<ExportArtifact> => {
  const recipe = record.recipeJson
  const ingredientRows = recipe.ingredients
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.category)}</td>
        <td>${item.gross_weight}</td>
        <td>${item.net_weight}</td>
        <td>${percent(item.loss_rate)}</td>
        <td>${money(item.unit_price)}</td>
        <td>${money(item.cost)}</td>
        <td>${escapeHtml(item.spec)}</td>
      </tr>`
    )
    .join('')

  const processRows = recipe.process_steps
    .map(
      (step) => `
      <li>
        <strong>${step.step_no}. ${escapeHtml(step.action)}</strong><br/>
        <span>${escapeHtml(step.detail)}</span><br/>
        <small>温度：${escapeHtml(step.temperature)}｜时间：${escapeHtml(step.duration)}｜设备：${escapeHtml(step.equipment)}</small><br/>
        <em>关键控制点：${escapeHtml(step.key_control_point)}</em>
      </li>`
    )
    .join('')

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(record.name)} - 标准菜谱</title>
  <style>
    body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; margin: 24px; color: #10223d; }
    header, footer { text-align: center; color: #355484; }
    h1 { margin-bottom: 8px; }
    .card { border: 1px solid #bfd1ff; border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d8e4ff; padding: 8px; font-size: 13px; text-align: left; }
    th { background: #eef4ff; color: #203f74; }
    ul { margin: 6px 0; padding-left: 18px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <header><strong>${escapeHtml(BRAND_NAME)} · 标准菜谱 · ${escapeHtml(record.version)}</strong></header>
  <h1>${escapeHtml(recipe.recipe_meta.recipe_name)}</h1>
  <div class="card">
    <p>菜系：${escapeHtml(recipe.recipe_meta.cuisine)}｜出品量：${escapeHtml(recipe.recipe_meta.servings)}｜备料：${recipe.recipe_meta.prep_time_minutes} 分钟｜烹饪：${recipe.recipe_meta.cook_time_minutes} 分钟｜难度：${escapeHtml(recipe.recipe_meta.difficulty)}</p>
    <p>过敏原：${escapeHtml(recipe.recipe_meta.allergens.join('、') || '无')}</p>
    <p>描述：${escapeHtml(recipe.menu_copy.description)}</p>
    <p>卖点：${escapeHtml(recipe.menu_copy.selling_points.join('；'))}</p>
  </div>
  <div class="card">
    <h3>原料配方</h3>
    <table>
      <thead><tr><th>原料</th><th>分类</th><th>毛重</th><th>净重</th><th>损耗率</th><th>单价</th><th>成本</th><th>规格</th></tr></thead>
      <tbody>${ingredientRows}</tbody>
    </table>
  </div>
  <div class="card">
    <h3>操作工艺</h3>
    <ol>${processRows}</ol>
  </div>
  <div class="card">
    <h3>SOP 与食安</h3>
    <p>食品安全：${escapeHtml(recipe.sop.food_safety.join('；'))}</p>
    <p>摆盘标准：${escapeHtml(recipe.sop.plating_standard)}</p>
    <p>保质期：${escapeHtml(recipe.sop.shelf_life)}</p>
    <p>储存方式：${escapeHtml(recipe.sop.storage)}</p>
    <p>执行备注：${escapeHtml(recipe.sop.execution_notes)}</p>
  </div>
  <div class="card">
    <h3>成本核算</h3>
    <p>原料成本：${money(recipe.costing.total_material_cost)}｜包装：${money(recipe.costing.packaging_cost)}｜人力：${money(recipe.costing.labor_cost)}｜其它：${money(recipe.costing.other_cost)}</p>
    <p>总成本：${money(recipe.costing.total_cost)}｜建议售价：${money(recipe.costing.suggested_price)}｜成本率：${percent(recipe.costing.cost_rate)}｜毛利率：${percent(recipe.costing.gross_margin_rate)}</p>
  </div>
  <footer>${escapeHtml(BRAND_NAME)} · 内部资料 · 未经授权禁止外传</footer>
</body>
</html>`

  return {
    fileName: `${record.name}-标准菜谱.html`,
    mimeType: 'text/html; charset=utf-8',
    buffer: Buffer.from(html, 'utf8'),
  }
}

export const buildAllInOneZipArtifact = async (
  record: RecipeSkillRecord
): Promise<ExportArtifact> => {
  const [word, excel, pdfHtml] = await Promise.all([
    buildWordArtifact(record),
    buildExcelArtifact(record),
    buildPdfHtmlArtifact(record),
  ])
  const zip = new JSZip()
  zip.file(word.fileName, word.buffer)
  zip.file(excel.fileName, excel.buffer)
  zip.file(pdfHtml.fileName, pdfHtml.buffer)
  zip.file(`${record.name}-recipe.json`, JSON.stringify(record.recipeJson, null, 2))
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return {
    fileName: `${record.name}-标准菜谱打包.zip`,
    mimeType: 'application/zip',
    buffer,
  }
}
