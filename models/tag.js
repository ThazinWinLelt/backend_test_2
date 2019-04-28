const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    login: {
      type: String,
      // unique: true,
      required: [true, "is required"]
      // index: true
    },
    tagname: {
      type: String,
      required: [true, "is required"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tag", tagSchema);
