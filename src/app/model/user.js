"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
