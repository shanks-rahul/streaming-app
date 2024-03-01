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
import userRoutes from './routes/user.routes.js';
import movieRoutes from './routes/movie.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
import paymentRoutes from './routes/payment.routes.js';
import miscellaneousRoutes from './routes/miscellaneous.routes.js';

app.use("/api/v1/user",userRoutes);
app.use("/api/v1/movies",movieRoutes);
app.use("/api/v1/payment",paymentRoutes);
app.use("/api/v1",miscellaneousRoutes);
app.use(errorMiddleware);

app.use("/ping",(_req,res)=>{
    res.send("pong");
})


export default app;