const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema(
  {
    login: {
      type: String
      // unique: true,
      // index: true
    },
    password: {
      type: String,
      required: [true, "is required"]
    },
    firstname: {
      type: String,
      required: [true, "is required"],
      match: [/^[a-zA-Z]+$/, "is invalid"]
    },
    lastname: {
      type: String,
      required: [true, "is required"],
      match: [/^[a-zA-Z]+$/, "is invalid"]
    },
    gender: {
      type: String,
      required: [true, "is required"],
      enum: ["M", "F"]
    },
    email: {
      type: String,
      required: [true, "is required"],
      match: [/\S+@\S+\.\S+/, "is invalid"]
      // index: true
    },
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return /[+][(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*/.test(v);
        },
        message: props => `is not a valid phone number`
        // message: props => `${props.value} is not a valid phone number!`
      }
    },
    isAdmin: {
      type: Boolean,
      required: [true, "is required"]
    }
  },
  { timestamps: true }
);

userSchema.plugin(uniqueValidator, { message: "is already taken." });

module.exports = mongoose.model("User", userSchema);
