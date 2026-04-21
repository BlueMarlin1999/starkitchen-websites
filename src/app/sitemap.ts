import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://starkitchen.ai';
  const now = new Date().toISOString();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/industries`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/capabilities`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/dashboard`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/dashboard/finance`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/dashboard/stores`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/dashboard/hr`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/dashboard/ai`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/dashboard/agents`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/dashboard/opr`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];
}
