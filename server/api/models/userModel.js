import { Schema, model } from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const schema = {
    fullName: {
        type: String,
        required: [true, 'Please enter a valid full name.'],
        minLength: [2, 'Full name entered is too short.'],
        maxLength: [30, 'Full name entered is too long.'],
    },
    userName: {
        type: String,
        unique: [true, 'Username must be unique.'],
        required: [true, 'Please enter a valid username.'],
    },
    email: {
        type: String,
        required: [true, 'Please enter a valid email.'],
        unique: true,
        validate: [validator.isEmail, 'Please enter a valid email.'],
    },
    password: {
        type: String,
        minLength: [8, 'Password should be greater than 8 characters'],
        select: false,
    },
    role: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        required: true,
    },
    confirmEmailToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    tokens: [{ type: String, required: true }],
};

const UserSchema = new Schema(schema, { timestamps: true });

UserSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 10);
    next();
});

UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

UserSchema.methods.getJwtToken = async function () {
    const user = this;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE,
    });
    let tokens = user.tokens;
    tokens.push(token);
    user.tokens = tokens;
    await user.save();
    return token;
};

UserSchema.methods.generateConfirmEmailToken = async function () {
    const user = this;
    const verificationToken = crypto.randomBytes(20).toString('hex');

    user.confirmEmailToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    await user.save();
    return verificationToken;
};

UserSchema.methods.generateResetPasswordToken = async function () {
    const user = this;

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // will expire after 15 minutes
    await user.save();

    return resetToken;
};

export default model('User', UserSchema);