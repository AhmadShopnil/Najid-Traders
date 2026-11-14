import mongoose from 'mongoose'

const MenuItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    target: { type: String, enum: ['_self', '_blank'], default: '_self' },
    badge: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    children: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false }
)

const MenuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    location: {
      type: String,
      enum: ['main_header', 'top_bar', 'footer_col1', 'footer_col2', 'footer_col3', 'custom'],
      default: 'custom',
    },
    description: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
    items: [MenuItemSchema],
  },
  { timestamps: true }
)

MenuSchema.index({ slug: 1, location: 1, isActive: 1 })

if (mongoose.models.Menu) {
  delete mongoose.models.Menu
}

export const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema)
