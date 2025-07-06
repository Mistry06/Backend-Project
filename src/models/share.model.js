import mongoose, { Schema } from "mongoose";

const shareSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },
    platform: {
      type: String,
      enum: ["facebook", "twitter", "whatsapp", "email", "copy_link", "other"],
      default: "other"
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    message: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

export const Share = mongoose.model("Share", shareSchema);
