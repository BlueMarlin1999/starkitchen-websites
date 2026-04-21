import type { Metadata } from 'next'

export type SiteVariant = 'corporate' | 'ai-tech'

const corporateMetadata: Metadata = {
  metadataBase: new URL('https://starkitchen.ai'),
  title: {
    default: '星厨集团 SK Group | Star Kitchen Hospitality Group',
    template: '%s | Star Kitchen',
  },
  description:
    '星厨集团 SK Group 是由 AI、人才与供应链驱动的全球化餐饮服务商，以“环球美味 邻里共享、国际标准 数智未来”为主张，面向企业、医疗、教育、酒店等多行业场景提供现代餐饮与服务解决方案。',
  keywords: [
    'Star Kitchen',
    '星厨集团',
    '星座厨房酒店餐饮管理有限公司',
    'hospitality services',
    'food service group',
    '团餐服务',
    '中央厨房',
    '餐饮供应链',
    'AI hospitality',
    'AI food service',
    'restaurant operations system',
  ],
  authors: [{ name: 'Star Kitchen Hospitality Group' }],
  creator: 'Star Kitchen Hospitality Group',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://starkitchen.ai',
    siteName: '星厨集团 SK Group',
    title: '星厨集团 SK Group | Star Kitchen Hospitality Group',
    description:
      '以“环球美味 邻里共享、国际标准 数智未来”为品牌主张，把国际餐饮标准、本土温度、服务美学与数智能力连接起来。',
    images: [
      {
        url: '/brand/star-kitchen-logo.jpg',
        width: 1280,
        height: 1707,
        alt: 'Star Kitchen',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '星厨集团 SK Group | Star Kitchen Hospitality Group',
    description: '环球美味，邻里共享。国际标准，数智未来。',
    images: ['/brand/star-kitchen-logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
  },
}

const aiTechMetadata: Metadata = {
  metadataBase: new URL('https://starkitchenai.com'),
  title: {
    default: 'StarKitchen AI | AI Operating System for Service Chains',
    template: '%s | StarKitchen AI',
  },
  description:
    'StarKitchen AI 是面向连锁服务业的 AI 科技公司，为餐饮、团餐、酒店、物业与服务零售提供 AI 指挥台、智能体、审批工单、多模态能力与可治理的经营系统。',
  keywords: [
    'StarKitchen AI',
    'starkitchenai.com',
    'service industry AI',
    'service chain AI',
    'restaurant AI',
    'hospitality AI platform',
    'AI operating system',
    'workflow automation',
    'AI agents',
    '多门店 AI',
    '连锁服务业 AI',
  ],
  authors: [{ name: 'StarKitchen AI' }],
  creator: 'StarKitchen AI',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://starkitchenai.com',
    siteName: 'StarKitchen AI',
    title: 'StarKitchen AI | AI Operating System for Service Chains',
    description:
      '为连锁餐饮、团餐、酒店、物业与服务零售构建 AI Operating System，把经营洞察、智能体协作、审批工单与治理能力接进同一套平台。',
    images: [
      {
        url: '/brand/star-kitchen-logo.jpg',
        width: 1280,
        height: 1707,
        alt: 'StarKitchen AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StarKitchen AI | AI Operating System for Service Chains',
    description: 'Service-chain AI platform for operations, agents, workflows and governed execution.',
    images: ['/brand/star-kitchen-logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
  },
}

const corporateOrganizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Star Kitchen Hospitality Group',
  alternateName: ['星厨集团', '星座厨房酒店餐饮管理有限公司', 'SK Group'],
  url: 'https://starkitchen.ai',
  description: '由 AI、人才与供应链驱动的全球化餐饮服务商，致力于将国际星级餐饮标准，以高质价比普惠至企业、医疗、教育等全行业场景。',
  foundingDate: '2024',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Singapore',
    addressRegion: 'Marina Bay',
    addressCountry: 'SG',
  },
  sameAs: [
    'https://www.starkitchen.ai',
    'https://starkitchen.ai',
    'https://starkitchenai.com',
    'https://www.starkitchenai.com',
  ],
}

const aiTechOrganizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'StarKitchen AI',
  alternateName: ['星厨智能', 'StarKitchen AI'],
  url: 'https://starkitchenai.com',
  description:
    '面向连锁服务业的 AI 科技公司，提供 AI 指挥台、智能体协作、审批工单、多模态生成与治理能力。',
  foundingDate: '2026',
  sameAs: [
    'https://starkitchenai.com',
    'https://www.starkitchenai.com',
    'https://starkitchen.ai',
    'https://www.starkitchen.ai',
  ],
}

const aiHosts = new Set(['starkitchenai.com', 'www.starkitchenai.com'])

const normalizeHost = (host?: string | null) => (host || '').toLowerCase().split(':')[0]

export function resolveSiteVariantFromHost(host?: string | null): SiteVariant {
  return aiHosts.has(normalizeHost(host)) ? 'ai-tech' : 'corporate'
}

export function buildSiteMetadata(variant: SiteVariant): Metadata {
  return variant === 'ai-tech' ? aiTechMetadata : corporateMetadata
}

export function buildOrganizationJsonLd(variant: SiteVariant) {
  return variant === 'ai-tech' ? aiTechOrganizationJsonLd : corporateOrganizationJsonLd
}

export const siteMetadata = corporateMetadata
export const organizationJsonLd = corporateOrganizationJsonLd
