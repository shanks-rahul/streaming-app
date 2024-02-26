import { Schema, model } from 'mongoose';
import bycrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const UserSchema=Schema.create({
    fullName:{
        required:[true,"FullName is required"],
        type:String,
        trim:true,
        lowercase:true,
        minlength: [5, 'Name must be at least 5 characters'],
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please fill in a valid email address',
        ],
    },
    password:{
        type: String,
        required:[true,"password is required"],
        select:false,
        minlength:[8,"password must be of atleast 8 characters"]
    },
    subscription:{
        id:String,
        status:String,
    },
    avatar:{
        public_id:{
            type:String,
        },
        secure_url:{
            type:String,
        }
    },
    role:{
        type:String,
        enum:["USER","ADMIN"],
        default:"USER"
    },
    forgotPasswordToken:String,
    forgotPasswordExpiry:Date
},
{
    timestamps:true,
});

UserSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next();
    this.password=await bycrypt.hash(this.password,10);
});

UserSchema.methods = {
    comparePassword: async function(password){
        return await bycrypt.compare(password,this.password);
    },
    generateJWTtoken: async function(){
        return await jwt.sign(
            {id:this._id,role:this.role,subscription:this.subscription},
            process.env.SECRET,
            {
                expiresIn:'24h'
            }
        );
    },
    generatePasswordResetToken: async function(){
        const resetToken=crypto.randomBytes(20).toString('hex');
        
        this.forgotPasswordToken=crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

        this.forgotPasswordExpiry=Date.now()+15*60*1000;

        return resetToken;
    }
}

const User=model("User",UserSchema);

export default User;