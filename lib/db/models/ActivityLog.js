import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'update',
        'delete',
        'publish',
        'unpublish',
        'archive',
        'upload',
        'assign',
        'remove',
      ],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['content', 'module', 'page', 'media', 'user', 'setting', 'role', 'group'],
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      index: true,
    },
    entityTitle: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'System' },
      email: { type: String, default: '' },
      role: { type: String, default: '' },
      avatar: { type: String, default: null },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

// Index for fast chronological queries
activityLogSchema.index({ createdAt: -1 })
activityLogSchema.index({ entityType: 1, createdAt: -1 })
activityLogSchema.index({ action: 1, createdAt: -1 })
activityLogSchema.index({ entityType: 1, action: 1, createdAt: -1 })

export const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema)
