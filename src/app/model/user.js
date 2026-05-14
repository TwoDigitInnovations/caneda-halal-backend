"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const passengerSchema = new mongoose.Schema(
  {
    Title: { type: String, enum: ['Mr', 'Mrs', 'Ms', 'Master'], default: 'Mr' },
    FirstName: { type: String, required: true },
    LastName: { type: String, required: true },
    PaxType: { type: Number, enum: [1, 2, 3], default: 1 }, // 1=Adult, 2=Child, 3=Infant
    DateOfBirth: { type: String },
    Gender: { type: Number, enum: [1, 2], default: 1 }, // 1=Male, 2=Female
    PassportNo: { type: String },
    PassportExpiry: { type: String },
    AddressLine1: { type: String },
    AddressLine2: { type: String },
    City: { type: String },
    CountryCode: { type: String, default: 'IN' },
    CountryName: { type: String, default: 'India' },
    Nationality: { type: String, default: 'IN' },
    ContactNo: { type: String },
    Email: { type: String },
    IsLeadPax: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    username: {
      type: String,
    },
    type:{
      type:String,
      enum:['ADMIN','USER']
    },
    ///for admin
    password: {
      type: String,
    },
    ///for company
    email: {
      type: String,
    },
    tax_number: {
      type: String,
    },
    passengers: {
      type: [passengerSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);
userSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

userSchema.methods.encryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};
userSchema.methods.isValidPassword = function isValidPassword(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
