import mongoose, {Schema} from "mongoose";


const likeSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video"
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment"
  },
  tweet: {
    type: Schema.Types.ObjectId,
    ref: "Tweet"
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true  // ✅ enforce that every like has a user
  }
}, { timestamps: true });


export const Like = mongoose.model("Like", likeSchema)