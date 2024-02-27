import { Router } from "express";
import { addEpisodesToMovieById, createMovies, getAllMovies, getEpisodesByCourseId, removeEpisodesByMovieId } from "../controllers/movie.controller.js";
import { authorizedRoles, authorizedSubscriber, isLoggedIn } from "../middlewares/auth.middleware";
import upload from "../middlewares/multer.middleware.js";
const router=Router();
router.get("/",getAllMovies);
router.post("/",isLoggedIn,authorizedRoles("ADMIN"),upload.single("thumbnail"),createMovies);
router.get("/:id",isLoggedIn,authorizedSubscriber,getEpisodesByCourseId);
router.post("/:id",isLoggedIn,authorizedRoles("ADMIN"),upload.single("episode"),addEpisodesToMovieById);
router.delete("/:id",isLoggedIn,authorizedRoles("ADMIN"),removeEpisodesByMovieId);

export default router;