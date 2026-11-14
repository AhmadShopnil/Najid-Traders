import mongoose from 'mongoose'

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6b7280' },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Role = mongoose.models.Role || mongoose.model('Role', roleSchema)
