import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import express from "express"

import { app } from './app.js'

dotenv.config({
    path:'./env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 5500,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
    .catch((error)=>{
        console.log("MONGO DB Connection Failed !!!",error);
    });



// (async () =>{
//     try{
//         await mongoose.connnect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         application.on("error",(error)=>{
//             console.log("ERROR: ",error);
//             throw error
//         })
//         application.listen(process.env.PORT,()=>{
//             console.log(`Server is running at port ${process.env.PORT}`);
//         })
//     }catch(error){
//         console.error('ERROR: ',error)
//         throw error
//     }
// })