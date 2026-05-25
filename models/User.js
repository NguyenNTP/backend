const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide name'],
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email',
    },
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    maxlength: 100,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guest'],
    default: 'user',
  },
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // only hash the password if it has been modified (or is new)

  const salt = await bcrypt.genSalt(10); // higher the number, more secure but slower
  this.password = await bcrypt.hash(this.password, salt); // hashing the password before saving
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password); // comparing the candidate password with the hashed password
  return isMatch;
};

module.exports = mongoose.model('User', UserSchema);
