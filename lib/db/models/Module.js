import mongoose from 'mongoose'

const fieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'text', 'longtext', 'richtext', 'number', 'boolean',
        'date', 'datetime', 'image', 'gallery', 'file', 'select',
        'multiselect', 'relation', 'slug', 'email', 'url', 'json', 'location', 'keyvalue',
      ],
    },
    required: { type: Boolean, default: false },
    unique: { type: Boolean, default: false },
    isListField: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      options: [String],
    },
    default: mongoose.Schema.Types.Mixed,
    ui: {
      helpText: String,
      placeholder: String,
      widgetType: String,
    },
    relation: {
      moduleId: String,
      relationType: { type: String, enum: ['one', 'many'] },
    },
  },
  { _id: false }
)

const moduleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '📦' },
    isActive: { type: Boolean, default: true },
    settings: {
      isSearchable: { type: Boolean, default: false },
      hasSEOFields: { type: Boolean, default: false },
      hasStatus: { type: Boolean, default: true },
      hasAuthor: { type: Boolean, default: true },
      allowPublicRead: { type: Boolean, default: true },
      sortableFields: [String],
    },
    fields: [fieldSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

moduleSchema.index({ slug: 1, isActive: 1 })
moduleSchema.index({ isActive: 1, createdAt: -1 })

export const Module =
  mongoose.models.Module || mongoose.model('Module', moduleSchema)
