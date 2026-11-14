import mongoose from 'mongoose'

const termSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'TaxonomyTerm',
    },
    description: { type: String, default: '' },
    color: { type: String, default: '#8b5cf6' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const taxonomySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    hierarchical: { type: Boolean, default: true },
    allowMultiple: { type: Boolean, default: true },
    required: { type: Boolean, default: false },
    description: { type: String, default: '' },
    terms: [termSchema],
  },
  { timestamps: true }
)

taxonomySchema.index({ moduleId: 1, slug: 1 }, { unique: true })
taxonomySchema.index({ moduleId: 1, createdAt: 1 })

export const Taxonomy =
  mongoose.models.Taxonomy || mongoose.model('Taxonomy', taxonomySchema)
