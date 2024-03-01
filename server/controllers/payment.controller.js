
import { razorpay } from "../index.js";
import asyncHandler from "../middlewares/asynhandler.middleware.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError";
import crypto from "crypto";

export const buySubscription=asyncHandler(async(req,res,next)=>{
    const {id}=req.user;
    const user=await User.findById(id);
    if(!user){
        return next(new AppError("User not found",403));
    }
    if(user.role==="ADMIN"){
        return next(new AppError("Admin is not allowed to buy subscription",403));
    };
    const subscription=await razorpay.subscriptions.create({
        plan_id:process.env.RAZORPAY_PLAN_ID,
        customer_notify:1,
        total_count:12
    });
    user.subscription.id=subscription.id;
    user.subscription.status=subscription.status;
    await user.save();
    res.status(200).json({
        success:true,
        message:"subscribed successfully",
        subscription_id:subscription.id
    })
});
export const verifySubscription=asyncHandler(async(req,res,next)=>{
    const {id}=req.user;
    const {razorpay_payment_id,razorpay_signature,razorpay_subscription_id}=req.body;
    const user=await User.findById(id);

    if(!user){
        return next(new AppError("User not found",403));
    }
    const subscriptionId=user.subscription.id;

    const generatedSignature=crypto
    .createHmac('sha256',process.env.RAZORPAY_SECRET)
    .update(`${razorpay_payment_id}|${subscriptionId}`)
    .digest('hex');

    if(generatedSignature!==razorpay_signature){
        return next(new AppError("payment not verified",403));
    };
    await Payment.create({
        razorpay_subscription_id,
        razorpay_payment_id,
        razorpay_signature
    });
    user.subscription.status="active";
    await user.save();
    await Payment.save();
    res.status(200).json({
        success:true,
        message:"payment verified successfully",    
    })

});
export const getRazorpayApiKey=asyncHandler(async(req,res,next)=>{
    res.status(200).json({
        success:true,
        message:"Razorpay API key",
        key:process.env.RAZORPAY_KEY
    })
});
export const cancelSubscription=asyncHandler(async(req,res,next)=>{
    const {id}=req.user;
    const user=await User.findById(id);
    if(!user){
        return next(new AppError("User not found",403));
    }
    const subscriptionId=user.subscription.id;
    try {
        const subscription=await razorpay.subscriptions.cancel(
            subscriptionId
        );
        user.subscription.status=subscription.status;
        await user.save();

    } catch (error) {
        return next(new AppError(error.error.description, error.statusCode));
    }
    const payment=await Payment.findOne({
        razorpay_subscription_id:subscriptionId
    });
    const timeSinceSubscribed=Date.now()=payment.createdAt;
    const refundPeriod=14*24*60*60*1000;
    if(refundPeriod<=timeSinceSubscribed){
        return next(new AppError('Refund Period is Over',403));
    };
    await razorpay.payments.refund(payment.razorpay_payment_id,{
        speed:"optimum",
    })
    user.subscription.id=undefined;
    user.subscription.status=undefined;
    await user.save();
    await payment.remove();
    res.status(200).json({
        success:true,
        message:"Payment Refunded Successfully"
    })
});
export const allPayments=asyncHandler(async(req,res,next)=>{
    const {skip,count}=req.query;
    const allPayments = await razorpay.subscriptions.all({
        count: count ? count : 10, // If count is sent then use that else default to 10
        skip: skip ? skip : 0, // // If skip is sent then use that else default to 0
    });
    const monthNames=[
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
    ];
    const finalMonths={
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
    }
    const monthlywisePayments=allPayments.items.map((payment)=>{
        const monthinNumber=new Date(payment.start_at*1000);
        return monthNames[monthinNumber.getMonth()];
    });
    monthlywisePayments.map((month)=>{
        Object.keys(finalMonths).forEach((objMonth)=>{
            if(month==objMonth){
                finalMonths[month]+=1;
            }
        });
    });

    const monthlySalesRecords=[];

    Object.keys(finalMonths).forEach((month)=>{
        monthlySalesRecords.push(finalMonths[month]);
    });
    res.status(200).json({
        success:true,
        message:"all payments",
        allPayments,
        monthlySalesRecords,
        finalMonths
    })

})