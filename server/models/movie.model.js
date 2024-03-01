import { Schema, model } from "mongoose";
import { stringify } from "querystring";
const movieSchema = new Schema({
    title: {
        type: String,
        required: [true, "Title is Required"],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [20, 'Description must be atleast 20 characters long'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
    },
    episodes: [
        {
            title: String,
            description: String,
            episode: {
                public_id: {
                    type: String,
                    required: true,
                },
                secure_url: {
                    type: String,
                    required: true,
                }
            }
        },
    ],
    thumbnail: {
        public_id: {
            type: String,
        },
        secure_url: {
            type: String,
        },
    },
    numberOfEpisodes: {
        type: Number,
    },
    directedBy:{
        type:String,
        required:true,
    },
    producedBy:{
        type:String,
        required:true
    }
});

const Movie=model("Movie",movieSchema);
export default Movie;