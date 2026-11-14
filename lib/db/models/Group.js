import mongoose from 'mongoose'

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6b7280' },
    // Roles assigned to this group — members inherit their permissions
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    // Additional permissions on top of role-inherited ones
    permissions: [{ type: String }],
    // Group members
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

groupSchema.index({ members: 1 })
groupSchema.index({ createdAt: -1 })

export const Group = mongoose.models.Group || mongoose.model('Group', groupSchema)
