import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  firebaseUid: { type: String, unique: true },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
});

const User = mongoose.model('User', userSchema);

export default User;
