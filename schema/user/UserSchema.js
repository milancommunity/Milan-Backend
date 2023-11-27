const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  userType: { type: String },
  slug: {
    type: String,
    required: true,
  },
  name: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  tagLine: { type: String },
  description: { type: String },
  city: { type: String },
  state: { type: String },
  address: { type: String },
  country: { type: String },
  pincode: { type: String },
  cart: [{ id: { type: String } }],
});

module.exports = mongoose.model("user", UserSchema);
