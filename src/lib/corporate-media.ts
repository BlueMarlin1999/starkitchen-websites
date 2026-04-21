export interface CorporateMediaAsset {
  src: string
  alt: string
  credit: string
}

export interface CorporateVideoAsset extends CorporateMediaAsset {
  poster: string
}

export const corporateMedia = {
  heroVideo: {
    src: 'https://www.pexels.com/download/video/4253333/',
    poster: 'https://images.pexels.com/photos/4253312/pexels-photo-4253312.jpeg?cs=srgb&dl=pexels-cottonbro-4253312.jpg&fm=jpg',
    alt: 'Professional chefs plating and cooking in an open restaurant kitchen',
    credit: 'Pexels / cottonbro studio',
  } satisfies CorporateVideoAsset,
  serviceKitchen: {
    src: 'https://images.pexels.com/photos/4253312/pexels-photo-4253312.jpeg?cs=srgb&dl=pexels-cottonbro-4253312.jpg&fm=jpg',
    alt: 'Professional chefs plating a dish in a restaurant kitchen',
    credit: 'Pexels / cottonbro studio',
  } satisfies CorporateMediaAsset,
  platedService: {
    src: 'https://images.pexels.com/photos/30729163/pexels-photo-30729163.jpeg?cs=srgb&dl=pexels-travelerchitect-30729163.jpg&fm=jpg',
    alt: 'A plated gourmet dish being served in a restaurant setting',
    credit: 'Pexels / M.Emin BILIR',
  } satisfies CorporateMediaAsset,
  waiterService: {
    src: 'https://images.pexels.com/photos/30729159/pexels-photo-30729159.jpeg?cs=srgb&dl=pexels-travelerchitect-30729159.jpg&fm=jpg',
    alt: 'A waiter carrying plated dishes through a restaurant dining room',
    credit: 'Pexels / M.Emin BILIR',
  } satisfies CorporateMediaAsset,
  tableService: {
    src: 'https://images.pexels.com/photos/30729110/pexels-photo-30729110.jpeg?cs=srgb&dl=pexels-travelerchitect-30729110.jpg&fm=jpg',
    alt: 'Fine-dining style table service with a dish being presented',
    credit: 'Pexels / M.Emin BILIR',
  } satisfies CorporateMediaAsset,
  teamPreparation: {
    src: 'https://images.pexels.com/photos/15671416/pexels-photo-15671416.jpeg?cs=srgb&dl=pexels-luisbecerrafotografo-15671416.jpg&fm=jpg',
    alt: 'A team of chefs preparing plated meals in a professional kitchen',
    credit: 'Pexels / Luis Becerra Fotografo',
  } satisfies CorporateMediaAsset,
  baristaService: {
    src: 'https://images.pexels.com/photos/6829520/pexels-photo-6829520.jpeg?cs=srgb&dl=pexels-kampus-6829520.jpg&fm=jpg',
    alt: 'A barista carrying coffee and juice on a tray in a cafeteria setting',
    credit: 'Pexels / Kampus Production',
  } satisfies CorporateMediaAsset,
  buffetService: {
    src: 'https://images.pexels.com/photos/32689482/pexels-photo-32689482.jpeg?cs=srgb&dl=pexels-change-c-c-974768353-32689482.jpg&fm=jpg',
    alt: 'A warm hospitality buffet line with prepared dishes under service lamps',
    credit: 'Pexels / Change C.C',
  } satisfies CorporateMediaAsset,
} as const
