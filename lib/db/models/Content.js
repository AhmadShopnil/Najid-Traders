import mongoose from 'mongoose'

const contentSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    moduleSlug: { type: String, required: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    taxonomies: { type: mongoose.Schema.Types.Mixed, default: {} },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

contentSchema.index({ moduleId: 1, status: 1, createdAt: -1 })
contentSchema.index({ moduleId: 1, status: 1, publishedAt: -1, createdAt: -1 })
contentSchema.index({ moduleSlug: 1, status: 1, createdAt: -1 })
contentSchema.index({ moduleId: 1, 'data.slug': 1 })
contentSchema.index({ createdAt: -1 })

export const Content =
  mongoose.models.Content || mongoose.model('Content', contentSchema)
