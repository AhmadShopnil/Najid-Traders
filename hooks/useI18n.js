'use client'

import { useSelector } from 'react-redux'
import { en } from '@/i18n/en'
import { bn } from '@/i18n/bn'

const translations = { en, bn }

export function useI18n() {
  const lang = useSelector((state) => state.ui.language)
  const t = translations[lang] || en

  function translate(key) {
    const keys = key.split('.')
    let value = t
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) return key
    }
    return value
  }

  return { t, translate, lang }
}
