import express from "express";
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"

import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import {connectDB} from "./libs/db.js"
import { app, server } from "./libs/socket.js";

app

dotenv.config()
const Port=process.env.PORT;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser())
app.use(cors({
  origin: "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use("/api/auth",authRoutes)
app.use("/api/messages",messageRoutes)

server.listen(Port,()=>{
    console.log('server is running PORT '+ Port);
    connectDB()
})
