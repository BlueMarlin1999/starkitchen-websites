import localFont from 'next/font/local'

export const corporateDisplay = {
  className: '[font-family:var(--sk-brand-serif)]'
} as const

export const corporateSans = {
  className: '[font-family:var(--sk-brand-sans)]'
} as const

export const corporateMono = localFont({
  src: '../app/fonts/GeistMonoVF.woff',
  display: 'swap'
})
