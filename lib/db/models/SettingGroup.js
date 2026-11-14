import mongoose from 'mongoose'

const fieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['text', 'longtext', 'image', 'gallery', 'number', 'boolean', 'json', 'url', 'color', 'select'],
    },
    options: { type: [mongoose.Schema.Types.Mixed], default: [] },
    description: { type: String, default: '' },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
)

const settingGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    isSystem: { type: Boolean, default: false },
    allowedRoles: { type: [String], default: [] },
    fields: [fieldSchema],
  },
  { timestamps: true }
)

settingGroupSchema.index({ isSystem: -1, createdAt: 1 })

const existingModel = mongoose.models.SettingGroup
if (existingModel) {
  const typeEnum = existingModel.schema.path('fields')?.schema?.path('type')?.enumValues || []
  const hasAllowedRoles = Boolean(existingModel.schema.path('allowedRoles'))
  if (!typeEnum.includes('select') || !hasAllowedRoles) {
    delete mongoose.models.SettingGroup
  }
}

export const SettingGroup =
  mongoose.models.SettingGroup || mongoose.model('SettingGroup', settingGroupSchema)
