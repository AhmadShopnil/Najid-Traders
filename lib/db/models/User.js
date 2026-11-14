import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },

    // Role slug synced from primary Role reference (supports both built-in and custom RBAC roles)
    role: {
      type: String,
      default: null,
    },

    // RBAC — primary role reference (new system, points to Role document)
    roleRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },

    // RBAC — group memberships
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],

    // RBAC — direct per-user permission overrides (industry standard)
    directPermissions: [{ type: String }],

    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
)

userSchema.index({ isActive: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ roleRef: 1 })
userSchema.index({ groups: 1 })

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  return obj
}

userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 12)
}

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

export const User = mongoose.models.User || mongoose.model('User', userSchema)
