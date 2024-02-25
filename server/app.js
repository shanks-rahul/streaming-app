import express from 'express';
import {config} from 'dotenv';
config();
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';


const app=express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));
app.use(
    cors({
        origin:[process.env.FRONTEND_URL],
        credentials:true
    })
)
app.use("/ping",(_req,res)=>{
    res.send("pong");
})
export default app;