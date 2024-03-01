import fs from 'fs/promises';
import path from 'path';

import cloudinary from 'cloudinary';

import asyncHandler from "../middlewares/asynhandler.middleware.js";
import Movie from "../models/movie.model.js";
import AppError from "../utils/AppError.js";

export const getAllMovies=asyncHandler(async(req,res,next)=>{
    const movie=await Movie.findOne({}).select('-episodes');
    res.status(200).json({
        success:true,
        message:"All Movies",
        movie
    })
});
export const createMovies=asyncHandler(async(req,res,next)=>{
    const {title,description,category,directedBy,producedBy}=req.body;
    if(!title || !description || !category || !directedBy || !producedBy){
        return next(new AppError("All Fields are required",400))
    };
    const movie=await Movie.create({
        title,
        description,
        category,
        directedBy,
        producedBy
    });
    if(!movie){
        return next(new AppError("unable to create the movie",400));
    }
    if (req.file) {
        try {
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'videostream-app', // Save files in a folder named lms
          });
    
          // If success
          if (result) {
            // Set the public_id and secure_url in array
            movie.thumbnail.public_id = result.public_id;
            movie.thumbnail.secure_url = result.secure_url;
          }
    
          // After successful upload remove the file from local storage
          fs.rm(`uploads/${req.file.filename}`);
        } catch (error) {
          // Empty the uploads directory without deleting the uploads directory
          for (const file of await fs.readdir('uploads/')) {
            await fs.unlink(path.join('uploads/', file));
          }
    
          // Send the error message
          return next(
            new AppError(
              JSON.stringify(error) || 'File not uploaded, please try again',
              400
            )
          );
        }
      }
    await movie.save();
    res.status(200).json({
        success:true,
        message:"Movie Created Successfully",
        movie
    });

});
export const getEpisodesByCourseId=asyncHandler(async(req,res,next)=>{
    const {id}=req.params;
    const movie=await Movie.findById(id);
    if(!movie){
        return next(new AppError("No Movie Found",400));
    }
    res.status(200).json({
        success:true,
        message:"Episodes Fetched Successfully",
        episodes:movie.episodes,
    });
});
export const addEpisodesToMovieById=asyncHandler(async(req,res,next)=>{
    const {id}=req.params;
    const {title,description}=req.body;
    if(!title || !description){
        return next(new AppError("All Fields are required",400))
    }
    const movie=await Movie.findById(id);
    if(!movie){
        return next(new AppError("No Movie Found",400));
    }
    let episodeData={};
    if (req.file) {
        try {
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'videostream-app', // Save files in a folder named videostream-app
            chunk_size: 50000000, // 50 mb size
            resource_type: 'video',
          });
    
          // If success
          if (result) {
            // Set the public_id and secure_url in array
            episodeData.public_id = result.public_id;
            episodeData.secure_url = result.secure_url;
          }
    
          // After successful upload remove the file from local storage
          fs.rm(`uploads/${req.file.filename}`);
        } catch (error) {
          // Empty the uploads directory without deleting the uploads directory
          for (const file of await fs.readdir('uploads/')) {
            await fs.unlink(path.join('uploads/', file));
          }
    
          // Send the error message
          return next(
            new AppError(
              JSON.stringify(error) || 'File not uploaded, please try again',
              400
            )
          );
        }
    }
    movie.episodes.push({
        title,
        description,
        episode:episodeData
    })
    movie.numberOfEpisodes=movie.episodes.length;
    
    await movie.save();

    res.status(200).json({
        success: true,
        message: 'episodes added successfully',
        movie,
    });
});
export const removeEpisodesByMovieId=asyncHandler(async(req,res,next)=>{
    const {episodeId,movieId}=req.query;
    if(!episodeId){
        return next(new AppError("episode Id is required",400));
    }
    if(!movieId){
        return next(new AppError("movie Id is required",400));
    }
    const movie=await Movie.findById(movieId);
    if(!movie){
        return next(new AppError("No Movie Found",400));
    }
    let episodeIndex=movie.episodes.find(
        (episode)=>episode._id.toString()===episodeId.toString()
    );
    if(episodeIndex==-1){
        return next(new AppError("lecture does not exist",400));
    }

    await cloudinary.v2.uploader.destroy(
        movie.episodes[episodeIndex].episode.public_id,
        {
          resource_type: 'video',
        }
    );
    movie.episodes.splice(episodeIndex,1);
    movie.numberOfEpisodes=movie.episodes.length;
    await movie.save();
    res.status(200).json({
        success:true,
        message:"episode deleted successfully",
        movie
    })
});
export const deleteMovieById=asyncHandler(async(req,res,next)=>{
    const {id}=req.params;
    const movie=await movie.findById(id);
    if(!movie){
        return next(new AppError("No Movie Found",400));
    }
    await movie.remove();
    res.status(200).json({
        success:true,
        message:"Movie deleted successfully",  
    })

})
