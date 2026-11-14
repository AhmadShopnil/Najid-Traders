import mongoose from 'mongoose'

const assetSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'document'], required: true },
    mimeType: String,
    size: Number,
    width: Number,
    height: Number,
    folder: { type: String, default: 'general' },
    tags: [String],
    alt: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

assetSchema.index({ createdAt: -1 })
assetSchema.index({ folder: 1, type: 1, createdAt: -1 })
assetSchema.index({ publicId: 1 }, { unique: true, sparse: true })
assetSchema.index({ uploadedBy: 1 })

export const Asset =
  mongoose.models.Asset || mongoose.model('Asset', assetSchema)
