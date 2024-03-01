import { Router } from "express";
import { authorizedRoles, isLoggedIn } from "../middlewares/auth.middleware.js";
import { getStat } from "../controllers/miscellaneous.contrroller.js";
const router=Router();
router.get("/admin/stats/user",authorizedRoles("ADMIN"),isLoggedIn,getStat);

export default router;