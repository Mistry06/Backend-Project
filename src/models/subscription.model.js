import mongoose ,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref: "User" // Correct: Use 'ref' as a property with a string value, referencing the 'User' model
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref: "User" // Correct: Use 'ref' as a property with a string value, referencing the 'User' model
    }
},{timestamps:true})

export const Subscription = mongoose.model("subscription",subscriptionSchema)