export type ProductCategoryId = 'dishes' | 'beverages' | 'peripheral' | 'value-added' | 'others'

export interface ProductCategoryMeta {
  id: ProductCategoryId
  title: string
  description: string
}

export interface ProductRecipeIngredient {
  name: string
  amount: number
  unit: string
  cost: number
}

export interface ProductRecipe {
  yield: string
  ingredients: ProductRecipeIngredient[]
  steps: string[]
}

export interface ProductSopSection {
  sectionTitle: string
  checkpoints: string[]
}

export interface ProductItem {
  id: string
  sku: string
  name: string
  category: ProductCategoryId
  cuisine: string
  primaryIngredient: string
  cookingMethod: string
  description: string
  unitCost: number
  suggestedPrice: number
  tags: string[]
  recipe: ProductRecipe
  sop: ProductSopSection[]
}

export const PRODUCT_CATEGORY_LIBRARY: ProductCategoryMeta[] = [
  {
    id: 'dishes',
    title: '菜品',
    description: '主食与热菜、冷菜产品库',
  },
  {
    id: 'beverages',
    title: '饮品',
    description: '咖啡、茶饮、气泡与功能饮',
  },
  {
    id: 'peripheral',
    title: '周边',
    description: '零售周边与品牌衍生商品',
  },
  {
    id: 'value-added',
    title: '增值',
    description: '会员服务与组合增值方案',
  },
  {
    id: 'others',
    title: '其它',
    description: '季节限定与实验性产品',
  },
]

export const PRODUCT_ITEMS: ProductItem[] = [
  {
    id: 'dish-hongshao-beef-bowl',
    sku: 'SK-DISH-0001',
    name: '红烧牛肉饭',
    category: 'dishes',
    cuisine: '江南融合',
    primaryIngredient: '牛腩',
    cookingMethod: '红烧',
    description: '以牛腩慢炖搭配时蔬，适配企业午餐高峰档。',
    unitCost: 14.8,
    suggestedPrice: 34,
    tags: ['热销', '午高峰', '标准化高'],
    recipe: {
      yield: '1 份 / 420g',
      ingredients: [
        { name: '牛腩', amount: 180, unit: 'g', cost: 9.2 },
        { name: '土豆', amount: 70, unit: 'g', cost: 0.9 },
        { name: '胡萝卜', amount: 40, unit: 'g', cost: 0.5 },
        { name: '酱汁基底', amount: 35, unit: 'g', cost: 1.2 },
        { name: '米饭', amount: 220, unit: 'g', cost: 3.0 },
      ],
      steps: [
        '牛腩切块焯水，沥干后与香料入锅翻炒 2 分钟。',
        '加入酱汁基底和 1:1.8 水量，压力锅炖煮 25 分钟。',
        '加入土豆与胡萝卜再炖煮 8 分钟，收汁至浓稠。',
        '定量装盘，搭配 220g 米饭，出餐温度保持 65°C 以上。',
      ],
    },
    sop: [
      {
        sectionTitle: '备料 SOP',
        checkpoints: ['牛腩脂肪修整率控制在 18% 内', '根茎类切配误差不超过 ±5g'],
      },
      {
        sectionTitle: '出品 SOP',
        checkpoints: ['每份牛肉净重 180g', '汁液覆盖米饭 40% 面积，不可溢盘'],
      },
      {
        sectionTitle: '品控 SOP',
        checkpoints: ['口感抽检每 2 小时 1 次', '保温时长超过 2 小时需下线重做'],
      },
    ],
  },
  {
    id: 'dish-blackpepper-chicken',
    sku: 'SK-DISH-0002',
    name: '黑椒鸡排意面',
    category: 'dishes',
    cuisine: '西式简餐',
    primaryIngredient: '鸡腿排',
    cookingMethod: '煎制',
    description: '高复购西式套餐，适配白领晚餐场景。',
    unitCost: 16.4,
    suggestedPrice: 38,
    tags: ['晚餐', '高复购'],
    recipe: {
      yield: '1 份 / 460g',
      ingredients: [
        { name: '去骨鸡腿排', amount: 190, unit: 'g', cost: 8.8 },
        { name: '意面', amount: 140, unit: 'g', cost: 2.6 },
        { name: '黑椒酱', amount: 38, unit: 'g', cost: 1.9 },
        { name: '彩椒洋葱', amount: 85, unit: 'g', cost: 1.4 },
        { name: '芝士碎', amount: 18, unit: 'g', cost: 1.7 },
      ],
      steps: [
        '鸡排腌制 20 分钟后，双面各煎 2 分钟锁汁。',
        '意面煮制 7 分钟，拌入黑椒酱与彩椒洋葱快炒 50 秒。',
        '鸡排切片铺面，撒芝士碎后以喷枪轻微炙香。',
      ],
    },
    sop: [
      {
        sectionTitle: '煎制 SOP',
        checkpoints: ['中心温度达到 75°C', '鸡排缩率不超过 12%'],
      },
      {
        sectionTitle: '装盘 SOP',
        checkpoints: ['鸡排切片 6 段等宽', '黑椒酱可见但不积液'],
      },
    ],
  },
  {
    id: 'dish-miso-salmon',
    sku: 'SK-DISH-0003',
    name: '味噌三文鱼饭',
    category: 'dishes',
    cuisine: '日式轻食',
    primaryIngredient: '三文鱼',
    cookingMethod: '烤制',
    description: '轻负担高蛋白产品，主打女性客群。',
    unitCost: 21.6,
    suggestedPrice: 49,
    tags: ['高蛋白', '轻食'],
    recipe: {
      yield: '1 份 / 390g',
      ingredients: [
        { name: '三文鱼排', amount: 150, unit: 'g', cost: 14.2 },
        { name: '味噌酱', amount: 25, unit: 'g', cost: 1.6 },
        { name: '羽衣甘蓝', amount: 60, unit: 'g', cost: 1.5 },
        { name: '糙米饭', amount: 180, unit: 'g', cost: 3.8 },
        { name: '柠檬', amount: 10, unit: 'g', cost: 0.5 },
      ],
      steps: [
        '三文鱼用味噌酱腌制 12 分钟。',
        '200°C 烤制 8 分钟，取出静置 60 秒。',
        '糙米饭铺底，蔬菜与鱼排分区摆放，柠檬点缀出餐。',
      ],
    },
    sop: [
      {
        sectionTitle: '烤制 SOP',
        checkpoints: ['表面轻焦不糊', '中心保留微嫩口感，避免过熟发柴'],
      },
      {
        sectionTitle: '健康标识 SOP',
        checkpoints: ['菜单页展示热量与蛋白信息', '可加价升级牛油果配菜'],
      },
    ],
  },
  {
    id: 'bev-yuzu-americano',
    sku: 'SK-BEV-0001',
    name: '柚香美式',
    category: 'beverages',
    cuisine: '咖啡',
    primaryIngredient: '阿拉比卡浓缩',
    cookingMethod: '冷萃拼配',
    description: '低糖提神，适配工作日全天段。',
    unitCost: 5.2,
    suggestedPrice: 18,
    tags: ['低糖', '提神'],
    recipe: {
      yield: '1 杯 / 450ml',
      ingredients: [
        { name: '浓缩咖啡', amount: 40, unit: 'ml', cost: 2.6 },
        { name: '柚子糖浆', amount: 18, unit: 'ml', cost: 1.3 },
        { name: '冰块', amount: 160, unit: 'g', cost: 0.4 },
        { name: '纯净水', amount: 240, unit: 'ml', cost: 0.9 },
      ],
      steps: [
        '杯内加入柚子糖浆与冰块。',
        '注入纯净水后顶部缓慢淋入浓缩咖啡，形成分层。',
        '附搅拌棒并提示饮用前搅拌。',
      ],
    },
    sop: [
      {
        sectionTitle: '出杯 SOP',
        checkpoints: ['杯口无挂液', '分层明显，30 秒内完成出杯'],
      },
    ],
  },
  {
    id: 'bev-oat-latte',
    sku: 'SK-BEV-0002',
    name: '燕麦拿铁',
    category: 'beverages',
    cuisine: '咖啡',
    primaryIngredient: '燕麦奶',
    cookingMethod: '蒸汽打发',
    description: '无乳糖友好饮品，适配早餐与下午茶。',
    unitCost: 7.9,
    suggestedPrice: 24,
    tags: ['无乳糖', '早餐'],
    recipe: {
      yield: '1 杯 / 360ml',
      ingredients: [
        { name: '浓缩咖啡', amount: 38, unit: 'ml', cost: 2.5 },
        { name: '燕麦奶', amount: 260, unit: 'ml', cost: 4.8 },
        { name: '奶沫稳定粉', amount: 2, unit: 'g', cost: 0.6 },
      ],
      steps: [
        '燕麦奶加热并打发至细腻奶沫。',
        '杯底加入浓缩后缓慢注入燕麦奶，顶部收口拉花。',
      ],
    },
    sop: [
      {
        sectionTitle: '奶沫 SOP',
        checkpoints: ['奶沫厚度 8-10mm', '温度 58°C-62°C'],
      },
    ],
  },
  {
    id: 'bev-lychee-sparkling',
    sku: 'SK-BEV-0003',
    name: '荔枝气泡饮',
    category: 'beverages',
    cuisine: '茶饮',
    primaryIngredient: '荔枝原浆',
    cookingMethod: '冷调',
    description: '夏季畅销饮品，适合搭配轻食套餐。',
    unitCost: 4.7,
    suggestedPrice: 16,
    tags: ['夏季限定', '套餐搭配'],
    recipe: {
      yield: '1 杯 / 500ml',
      ingredients: [
        { name: '荔枝原浆', amount: 30, unit: 'ml', cost: 1.8 },
        { name: '青柠汁', amount: 10, unit: 'ml', cost: 0.9 },
        { name: '苏打水', amount: 300, unit: 'ml', cost: 1.5 },
        { name: '冰块', amount: 180, unit: 'g', cost: 0.5 },
      ],
      steps: ['杯中加冰与原浆，加入青柠汁后注入苏打水，轻搅 2 圈出杯。'],
    },
    sop: [
      {
        sectionTitle: '风味 SOP',
        checkpoints: ['酸甜平衡，避免甜度过高', '气泡感保留至出杯后 8 分钟'],
      },
    ],
  },
  {
    id: 'peripheral-soup-cup',
    sku: 'SK-PER-0001',
    name: '保温汤杯',
    category: 'peripheral',
    cuisine: '周边',
    primaryIngredient: '304 不锈钢',
    cookingMethod: '组装',
    description: '通勤场景周边，提升品牌复购触达。',
    unitCost: 22.5,
    suggestedPrice: 69,
    tags: ['复购', '品牌周边'],
    recipe: {
      yield: '1 件',
      ingredients: [
        { name: '杯体', amount: 1, unit: '个', cost: 15.2 },
        { name: '密封盖', amount: 1, unit: '个', cost: 4.4 },
        { name: '包装盒', amount: 1, unit: '套', cost: 2.9 },
      ],
      steps: ['组装杯盖与杯体，进行密封测试，包装入盒并贴 SKU 标签。'],
    },
    sop: [
      {
        sectionTitle: '质检 SOP',
        checkpoints: ['100% 抽检密封性', '杯体刮擦不超过 AQL 标准'],
      },
      {
        sectionTitle: '陈列 SOP',
        checkpoints: ['与饮品区联动陈列', '标注 2 小时保温效果'],
      },
    ],
  },
  {
    id: 'peripheral-lunch-bag',
    sku: 'SK-PER-0002',
    name: '便携餐包',
    category: 'peripheral',
    cuisine: '周边',
    primaryIngredient: '防泼水帆布',
    cookingMethod: '缝制',
    description: '企业团购热门周边，支持 LOGO 定制。',
    unitCost: 16.8,
    suggestedPrice: 49,
    tags: ['团购', '定制'],
    recipe: {
      yield: '1 件',
      ingredients: [
        { name: '帆布面料', amount: 0.35, unit: 'm', cost: 8.9 },
        { name: '保温内衬', amount: 0.3, unit: 'm', cost: 5.2 },
        { name: '五金拉链', amount: 1, unit: '套', cost: 2.7 },
      ],
      steps: ['裁片、缝制、装配拉链，完成后进行承重测试。'],
    },
    sop: [
      {
        sectionTitle: '工艺 SOP',
        checkpoints: ['车线平整无跳针', '手提带承重达 6kg'],
      },
    ],
  },
  {
    id: 'value-corp-meeting-package',
    sku: 'SK-VAS-0001',
    name: '企业会议轻食套餐',
    category: 'value-added',
    cuisine: '套餐',
    primaryIngredient: '多品组合',
    cookingMethod: '组合',
    description: '满足 10-30 人会议场景的一站式轻食组合。',
    unitCost: 32.5,
    suggestedPrice: 78,
    tags: ['会议', '团餐增值'],
    recipe: {
      yield: '1 套 / 人',
      ingredients: [
        { name: '主食盒', amount: 1, unit: '份', cost: 18.5 },
        { name: '饮品', amount: 1, unit: '杯', cost: 5.0 },
        { name: '水果杯', amount: 1, unit: '份', cost: 6.4 },
        { name: '包装耗材', amount: 1, unit: '套', cost: 2.6 },
      ],
      steps: ['按预订单组合打包，出货前核验数量与饮品口味。'],
    },
    sop: [
      {
        sectionTitle: '履约 SOP',
        checkpoints: ['T-120 分钟锁单', '配送前二次清点，差错率目标 0.2% 以下'],
      },
      {
        sectionTitle: '服务 SOP',
        checkpoints: ['支持企业发票与账期', '会后回收 NPS 评分'],
      },
    ],
  },
  {
    id: 'value-monthly-membership',
    sku: 'SK-VAS-0002',
    name: '月度会员订阅',
    category: 'value-added',
    cuisine: '会员服务',
    primaryIngredient: '权益包',
    cookingMethod: '数字化配置',
    description: '会员订阅权益，覆盖餐食折扣与专属饮品。',
    unitCost: 6.5,
    suggestedPrice: 39,
    tags: ['会员', '复购提升'],
    recipe: {
      yield: '1 套权益 / 30 天',
      ingredients: [
        { name: '系统权益配置', amount: 1, unit: '套', cost: 3.2 },
        { name: '营销券包', amount: 1, unit: '套', cost: 2.1 },
        { name: '会员客服支持', amount: 1, unit: '份', cost: 1.2 },
      ],
      steps: ['支付成功后自动开通权益，次日 00:00 生效。'],
    },
    sop: [
      {
        sectionTitle: '开通 SOP',
        checkpoints: ['支付后 5 秒内完成权益写入', '异常单自动补偿券'],
      },
      {
        sectionTitle: '运营 SOP',
        checkpoints: ['每周推送权益使用提醒', '月末复购优惠提前 3 天触达'],
      },
    ],
  },
  {
    id: 'other-seasonal-bento',
    sku: 'SK-OTH-0001',
    name: '春季时令便当',
    category: 'others',
    cuisine: '季节限定',
    primaryIngredient: '时令蔬菜',
    cookingMethod: '蒸烤结合',
    description: '每季度更新配方，用于测试区域偏好。',
    unitCost: 17.3,
    suggestedPrice: 39,
    tags: ['季节限定', '新品测试'],
    recipe: {
      yield: '1 份 / 430g',
      ingredients: [
        { name: '鸡胸肉', amount: 130, unit: 'g', cost: 5.1 },
        { name: '时令蔬菜拼', amount: 140, unit: 'g', cost: 4.7 },
        { name: '杂粮饭', amount: 200, unit: 'g', cost: 3.9 },
        { name: '调味汁', amount: 28, unit: 'g', cost: 3.6 },
      ],
      steps: ['主料蒸制、蔬菜快烤后合并装盒，附调味汁。'],
    },
    sop: [
      {
        sectionTitle: '新品试销 SOP',
        checkpoints: ['首周仅投放 6 个项目点位', '每日复盘售罄率与差评关键词'],
      },
    ],
  },
  {
    id: 'other-lab-fermented-tea',
    sku: 'SK-OTH-0002',
    name: '实验室发酵茶',
    category: 'others',
    cuisine: '实验饮品',
    primaryIngredient: '乌龙茶基底',
    cookingMethod: '低温发酵',
    description: '用于新风味孵化的实验产品，不定期上线。',
    unitCost: 6.8,
    suggestedPrice: 22,
    tags: ['实验线', '创新风味'],
    recipe: {
      yield: '1 杯 / 450ml',
      ingredients: [
        { name: '乌龙茶汤', amount: 280, unit: 'ml', cost: 2.3 },
        { name: '低温发酵液', amount: 22, unit: 'ml', cost: 2.1 },
        { name: '果香糖浆', amount: 16, unit: 'ml', cost: 1.4 },
        { name: '冰块', amount: 170, unit: 'g', cost: 1.0 },
      ],
      steps: ['按比例混合后轻摇 6 次，确保气泡和茶香平衡。'],
    },
    sop: [
      {
        sectionTitle: '实验 SOP',
        checkpoints: ['仅在 A/B 点位售卖', '每日记录风味反馈与留存率'],
      },
    ],
  },
]

export const isProductCategoryId = (value: string): value is ProductCategoryId =>
  PRODUCT_CATEGORY_LIBRARY.some((item) => item.id === value)

export const getProductCategoryMeta = (category: ProductCategoryId) =>
  PRODUCT_CATEGORY_LIBRARY.find((item) => item.id === category) || null

export const getProductsByCategory = (category: ProductCategoryId) =>
  PRODUCT_ITEMS.filter((item) => item.category === category)

export const getProductById = (productId: string) =>
  PRODUCT_ITEMS.find((item) => item.id === productId) || null
