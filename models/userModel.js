
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Invalid email format (e.g., aya@polytechnique.tn)',
      ],
    },
    password : {
      type : String ,
      required : [true , 'Password is required'] ,
      minlength : [6 , 'Password must be at least 6 characters long']
    },
    age: {
      type: Number,
      min: [4, 'Minimum age is 4 years old'],
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not an authorized role',
      },
      default: 'user',
    },
    bio:{
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters']
    },
    phone: {
      type: String,
      match: [/^\d{8}$/, 'Phone number must be 8 digits'],
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

module.exports = mongoose.model('User', userSchema);
