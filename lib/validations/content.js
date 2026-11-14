import { z } from 'zod'

function optionalNonEmpty(schema, isRequired, message = 'This field is required') {
  if (isRequired) {
    return schema
  }
  return z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    schema.optional()
  )
}

function requiredString(label) {
  return z.string({ required_error: `${label} is required` }).trim().min(1, `${label} is required`)
}

const FIELD_VALIDATORS = {
  text: (field) => {
    const label = field.label || field.name
    let s = field.required ? requiredString(label) : z.string()
    if (field.validation?.min) s = s.min(field.validation.min)
    if (field.validation?.max) s = s.max(field.validation.max)
    return field.required ? s : z.preprocess((v) => (v === null ? undefined : v), s.optional())
  },
  longtext: (field) => {
    const label = field.label || field.name
    let s = field.required ? requiredString(label) : z.string()
    if (field.validation?.max) s = s.max(field.validation.max)
    return field.required ? s : z.preprocess((v) => (v === null ? undefined : v), s.optional())
  },
  richtext: (field) => {
    const label = field.label || field.name
    return field.required
      ? requiredString(label)
      : z.preprocess((v) => (v === null ? undefined : v), z.string().optional())
  },
  number: (field) => {
    let n = z.coerce.number({ invalid_type_error: `${field.label || field.name} must be a number` })
    if (field.validation?.min !== undefined) n = n.min(field.validation.min)
    if (field.validation?.max !== undefined) n = n.max(field.validation.max)
    if (field.required) {
      return z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), n)
    }
    return z.preprocess(
      (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : v),
      n.optional()
    )
  },
  boolean: () => z.preprocess((v) => (v === undefined || v === null ? false : Boolean(v)), z.boolean().optional()),
  date: (field) => optionalNonEmpty(z.string().min(1), field.required),
  datetime: (field) => optionalNonEmpty(z.string().min(1), field.required),
  image: (field) => optionalNonEmpty(z.string().min(1), field.required),
  file: (field) => optionalNonEmpty(z.string().min(1), field.required),
  gallery: (field) => {
    const s = z.array(z.string())
    return field.required ? s.min(1) : s.optional()
  },
  email: (field) => optionalNonEmpty(z.string().email('Please enter a valid email address'), field.required),
  url: (field) => optionalNonEmpty(z.string().url('Please enter a valid URL'), field.required),
  slug: (field) => optionalNonEmpty(z.string().min(1), field.required),
  json: () => z.any().optional(),
  select: (field) => {
    if (field.validation?.options?.length > 0) {
      const opt = z.enum(field.validation.options)
      return optionalNonEmpty(opt, field.required)
    }
    return optionalNonEmpty(z.string().min(1), field.required)
  },
  multiselect: (field) => {
    const arr = z.array(z.string())
    return field.required ? arr.min(1) : arr.optional()
  },
  relation: (field) => {
    const schema = z.union([z.string(), z.array(z.string())])
    return field.required ? schema : z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional())
  },
  location: () => z.object({ lat: z.coerce.number(), lng: z.coerce.number() }).optional(),
}

export function buildContentSchema(fields = []) {
  const shape = {}
  for (const field of fields) {
    const validator = FIELD_VALIDATORS[field.type]
    if (validator) shape[field.name] = validator(field)
  }
  return z.object(shape).passthrough()
}

export function validateContent(data, fields) {
  const schema = buildContentSchema(fields)
  const result = schema.safeParse(data || {})
  if (!result.success) {
    const errors = (result.error.issues || result.error.errors || []).map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))
    return { valid: false, errors }
  }
  return { valid: true, data: result.data }
}
