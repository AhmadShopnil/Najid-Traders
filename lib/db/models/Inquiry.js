import mongoose from 'mongoose'

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    company: { type: String, default: '', trim: true },
    subject: { type: String, default: '', trim: true },
    message: { type: String, required: true, trim: true },
    inquiryType: {
      type: String,
      enum: ['general', 'product'],
      default: 'general',
    },
    productId: { type: String, default: '' },
    productTitle: { type: String, default: '' },
    productSlug: { type: String, default: '' },
    productSku: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
)

inquirySchema.index({ status: 1, createdAt: -1 })
inquirySchema.index({ inquiryType: 1, createdAt: -1 })

export const Inquiry =
  mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema)
