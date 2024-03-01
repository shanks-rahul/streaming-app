import asyncHandler from "../middlewares/asynhandler.middleware.js";
import User from "../models/user.model.js";

export const getStat=asyncHandler(async(req,res,next)=>{
    const UserCounts=await User.countDocuments();
    const subscribedUserCounts=await User.countDocuments(
        {'subscription.status':'active'}
    );
    res.status(200).json({
        success:true,
        message:"All Users Count",
        UserCounts,
        subscribedUserCounts
    })
})