import mongoose from 'mongoose'

const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, default: 'Operations', trim: true },
    photo: { type: String, default: '' },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    bio: { type: String, default: '', trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featuredTitle: { type: String, default: '', trim: true },
    featuredQuote: { type: String, default: '', trim: true },
    expertise: { type: [String], default: [] },
  },
  { timestamps: true }
)

EmployeeSchema.index({ isActive: 1, isFeatured: -1, sortOrder: 1, createdAt: 1 })

if (mongoose.models.Employee) {
  delete mongoose.models.Employee
}

export const Employee =
  mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema)
