import asyncHandler from "../middlewares/asynhandler.middleware.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import fs from 'fs/promises';
import path from "path";
import cloudinary from 'cloudinary';
import sendEmail from "../utils/sendEmail.js";

const cookieOptions = {
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
}


export const register = asyncHandler(async (req, res, next) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return next(new AppError("All Fields are required", 400));
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new AppError("email already exists", 400));
    }
    const user = await User.create({
        fullName,
        email,
        password,
        avatar: {
            public_id: email,
            secure_url: "https://res.cloudinary.com/dyjl2cunt/image/upload/v1707121308/cld-sample-2.jpg"
        },
    })
    if (!user) {
        return next(new AppError("user registration failed", 400));
    }

    if (req.file) {
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'videostream-app',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill',
            });

            if (result) {
               
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                
                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (error) {
            return next(
                new AppError(error || 'File not uploaded, please try again', 400)
            );
        }
    }
    await user.save();

    const token = await user.generateJWTtoken();
    user.password = undefined;
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
        success: true,
        message: "user registered successfully",
        user
    })

});

export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError("All Fields are required", 400));
    }
    const user = await User.findOne({ email }).select("+password");

    if (!(user && (await user.comparePassword(password)))) {
        return next(new AppError("user does not exist or password does not match", 400));
    }
    const token = await user.generateJWTtoken();
    user.password = undefined;
    res.cookie("token", token, cookieOptions);
    res.status(200).json({
        success: true,
        message: "user logged in successfully",
        user
    })
});
export const logout = asyncHandler(async (req, res, next) => {
    res.cookie("token", null, {
        secure: true,
        maxAge: 0,
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: "user logged out successfully",
    })
})
export const getLoggedInUserDetails = asyncHandler(async (req, res, next) => {
    const { id } = req.user.id;
    const user = await User.findById(id);
    res.status(200).json({
        success: true,
        message: "user details",
        user
    })
})
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new AppError("Email is required", 401));
    }
    const user = await User.findOne({ email });
    if (!user) {
        return nexxt(new AppError("User is not registered", 401));
    }
    const resetToken = await user.generatePasswordResetToken();

    const resetUrl = c`${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;
    try {
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} successfully`,
        });

    } catch (error) {
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;

        return next(new AppError(error.message, 500));
    }

});
export const resetPassword = asyncHandler(async (req, res, next) => {
    const { password } = req.body;
    const { resetToken } = req.params;

    if (!password) {
        return next(new AppError("password is required", 500));
    }
    const forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const user = await user.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });
    if (!user) {
        return next(new AppError("invalid reset Token", 500));
    }
    user.password = password;

    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    res.status(200).json({
        success: true,
        message: "password changed successfully",
        user
    })

});
export const changePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user.id;
    if (!oldPassword || !newPassword) {
        return next(new AppError("All Fields are required", 500));
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
        return next(new AppError('Invalid user id or user does not exist', 400));
    }
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
        return next(new AppError('Invalid old password', 501));
    }
    user.password = newPassword;

    await user.save();
    user.password = undefined;

    res.status(200).json({
        success: true,
        message: "password changed successfully",
        user
    })

});
export const updateUser = asyncHandler(async (req, res, next) => {
    const { fullName } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
        return next(new AppError('Invalid user id or user does not exist'));
    }

    if (fullName) {
        user.fullName = fullName;
    }

    // Run only if user sends a file
    if (req.file) {
        // Deletes the old image uploaded by the user
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'videostream-app', // Save files in a folder named videostream-app
                width: 250,
                height: 250,
                gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after  cropping or resizing the original image
                crop: 'fill',
            });

            // If success
            if (result) {
                // Set the public_id and secure_url in DB
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                // After successful upload remove the file from local storage
                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (error) {
            return next(
                new AppError(error || 'File not uploaded, please try again', 400)
            );
        }
    }

    // Save the user object
    await user.save();

    res.status(200).json({
        success: true,
        message: 'User details updated successfully',
    });
})
