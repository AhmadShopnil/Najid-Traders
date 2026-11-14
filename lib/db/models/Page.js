import mongoose from 'mongoose'

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    sections: { type: mongoose.Schema.Types.Mixed, default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

pageSchema.index({ slug: 1, status: 1 })
pageSchema.index({ status: 1, updatedAt: -1 })

export const Page = mongoose.models.Page || mongoose.model('Page', pageSchema)
