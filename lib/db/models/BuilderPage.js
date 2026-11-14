import mongoose from 'mongoose'

const widgetSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    column: { type: Number, default: 0 },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
)

const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: 'Section' },
    slug: { type: String, default: '' },
    columns: { type: Number, default: 1 },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        bgType: 'light',
        bgColor: '#ffffff',
        padding: 'normal',
        containerWidth: 'boxed',
        columnRatio: 'equal',
        gap: 'normal',
        verticalAlign: 'center',
      }),
    },
    widgets: [widgetSchema],
  },
  { _id: false }
)

const builderPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    pageType: {
      type: String,
      enum: ['standard', 'module_feed', 'single_template', 'category_template'],
      default: 'standard',
    },
    targetModule: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    sections: [sectionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

builderPageSchema.index({ slug: 1, status: 1 })
builderPageSchema.index({ pageType: 1, targetModule: 1, status: 1 })
builderPageSchema.index({ status: 1, updatedAt: -1, createdAt: -1 })

export const BuilderPage =
  mongoose.models.BuilderPage || mongoose.model('BuilderPage', builderPageSchema)
