import { Router } from "express";
import { changePassword, forgotPassword, getLoggedInUserDetails, login, logout, register, resetPassword, updateUser } from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
const router=Router();

router.post("/signup",upload.single('avatar'),register);
router.post("/signin",login);
router.post("/logout",logout);
router.get("/me",isLoggedIn,getLoggedInUserDetails);
router.put("/update/:id",isLoggedIn,upload.single('avatar'),updateUser);
router.post("/reset",forgotPassword);
router.post("/reset/:resetToken",resetPassword);
router.post("/change-password",isLoggedIn,changePassword);

export default router;
