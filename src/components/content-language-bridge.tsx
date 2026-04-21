'use client'

import { useEffect, useRef } from 'react'
import { translateContentText } from '@/lib/content-i18n'

type ContentLanguage = 'zh' | 'en'

interface ContentLanguageBridgeProps {
  language: ContentLanguage
  ready: boolean
}

const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const
const SKIP_TAG_NAMES = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'TEXTAREA',
  'OPTION',
  'SELECT',
])
const EXCLUDED_SELECTOR =
  '[data-no-content-i18n="true"],[contenteditable="true"],.cm-editor,.monaco-editor,[data-slot="code-block"]'

type TranslatableAttribute = (typeof TRANSLATABLE_ATTRS)[number]

const textOriginalMap = new WeakMap<Text, string>()
const attributeOriginalMap = new WeakMap<Element, Map<TranslatableAttribute, string>>()

const shouldSkipElement = (element: Element | null) => {
  if (!element) return true
  if (SKIP_TAG_NAMES.has(element.tagName)) return true
  if (element.closest(EXCLUDED_SELECTOR)) return true
  return false
}

const rememberTextOriginal = (node: Text) => {
  if (textOriginalMap.has(node)) return
  textOriginalMap.set(node, node.nodeValue || '')
}

const applyLanguageToTextNode = (node: Text, language: ContentLanguage) => {
  const parent = node.parentElement
  if (shouldSkipElement(parent)) return
  if (!(node.nodeValue || '').trim()) return

  rememberTextOriginal(node)
  const original = textOriginalMap.get(node) || ''
  const targetValue =
    language === 'zh' ? original : translateContentText(original, language as 'zh' | 'en')
  if (node.nodeValue !== targetValue) {
    node.nodeValue = targetValue
  }
}

const ensureAttributeStore = (element: Element) => {
  const existing = attributeOriginalMap.get(element)
  if (existing) return existing
  const created = new Map<TranslatableAttribute, string>()
  attributeOriginalMap.set(element, created)
  return created
}

const applyLanguageToAttribute = (
  element: Element,
  attribute: TranslatableAttribute,
  language: ContentLanguage
) => {
  const current = element.getAttribute(attribute)
  if (current == null) return

  const store = ensureAttributeStore(element)
  if (!store.has(attribute)) {
    store.set(attribute, current)
  }

  const original = store.get(attribute) || current
  const targetValue =
    language === 'zh' ? original : translateContentText(original, language as 'zh' | 'en')

  if (current !== targetValue) {
    element.setAttribute(attribute, targetValue)
  }
}

const processElementAttributes = (root: HTMLElement, language: ContentLanguage) => {
  if (!shouldSkipElement(root)) {
    for (const attr of TRANSLATABLE_ATTRS) {
      applyLanguageToAttribute(root, attr, language)
    }
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  while (walker.nextNode()) {
    const element = walker.currentNode as Element
    if (shouldSkipElement(element)) continue
    for (const attr of TRANSLATABLE_ATTRS) {
      applyLanguageToAttribute(element, attr, language)
    }
  }
}

const processTextNodes = (root: HTMLElement, language: ContentLanguage) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const textNode = node as Text
      if (!(textNode.nodeValue || '').trim()) return NodeFilter.FILTER_REJECT
      if (shouldSkipElement(textNode.parentElement)) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  while (walker.nextNode()) {
    applyLanguageToTextNode(walker.currentNode as Text, language)
  }
}

const translateDocumentTree = (root: HTMLElement, language: ContentLanguage) => {
  processElementAttributes(root, language)
  processTextNodes(root, language)
}

export function ContentLanguageBridge({ language, ready }: ContentLanguageBridgeProps) {
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!ready || typeof document === 'undefined') return
    const root = document.body
    if (!root) return

    const runTranslation = () => {
      translateDocumentTree(root, language)
    }

    const scheduleTranslation = () => {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        runTranslation()
      })
    }

    runTranslation()
    const observer = new MutationObserver(() => {
      scheduleTranslation()
    })
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: Array.from(TRANSLATABLE_ATTRS),
    })

    return () => {
      observer.disconnect()
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [language, ready])

  return null
}
