import { Router } from "express";
import { authorizedRoles, authorizedSubscriber, isLoggedIn } from "../middlewares/auth.middleware.js";
import { allPayments, buySubscription, cancelSubscription, getRazorpayApiKey, verifySubscription } from "../controllers/payment.controller.js";
const router=Router();
router.post("/subscribe",isLoggedIn,buySubscription);
router.post("/verify",isLoggedIn,verifySubscription);
router.post("/unsubscribe",isLoggedIn,authorizedSubscriber,cancelSubscription);
router.get("/razorpay-key",isLoggedIn,getRazorpayApiKey);
router.get("/",isLoggedIn,authorizedRoles("ADMIN"),allPayments);

export default router;