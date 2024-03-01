import jwt from 'jsonwebtoken';
import asyncHandler from './asynhandler.middleware.js';
import AppError from '../utils/AppError.js';
import User from '../models/user.model.js';

export const isLoggedIn=asyncHandler(async(req,res,next)=>{
    const {token}=req.cookies;
    if(!token){
        return next(new AppError("unauthorized! please login...",403));
    }
    const decoded=await jwt.verify(token,process.env.SECRET);
    if (!decoded) {
        return next(new AppError("Unauthorized, please login to continue", 403));
    }
    req.user=decoded;
    next();
});
export const authorizedRoles=(...roles)=>
    asyncHandler(async(req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError("You are not allowed to access this route",403))
        }
        next();
    });
export const authorizedSubscriber=asyncHandler(async(req,res,next)=>{
    const user=await User.findById(req.user.id);
    if(user.role!=="ADMIN" && user.subscription.status!=="ACTIVE"){
        return next(new AppError("Please subscribe to access this route.", 403));
    }
    next();
})
