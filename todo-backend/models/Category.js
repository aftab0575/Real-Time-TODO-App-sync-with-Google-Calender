import { Schema, model } from 'mongoose';

const categorySchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#000000'
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Compound unique index: name + user
categorySchema.index({ name: 1, user: 1 }, { unique: true });

export default model('Category', categorySchema); 