import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import crypto from "crypto";
import sendAuthToken from "../../utils/sendAuthToken.js";
import sendEmail from "../../utils/sendEmail.js";
import User from "../models/userModel.js";

import sessionStorage from "node-sessionstorage"
// import axios from "axios"

dotenv.config({ path: "server/config/config.env" });

const requestId = uuidv4();

export const registerUser = async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body;

    let isUserPresent = await username.finOne({ email });
    isUserPresent = await username.finOne({ username });

    if (isUserPresent)
      return res
        .status(400)
        .send({ success: false, message: "User already exists" });

    const user = await User.create({
      fullName,
      username,
      email,
      password,
      role: "user",
      verified: false,
    });

    const confirmEmailToken = await user.generateConfirmEmailToken();
    const emailVerificationURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/verfication/email/${confirmEmailToken}`;

    const message = `Your verify email token is: \n\n ${emailVerificationURL}`;
    try {
      await sendEmail({
        email: user.email,
        subject: "AllSafe email verification",
        message,
      });
      res.status(200).send({
        success: true,
        user,
        message: "Check your mail inbox and get verififed as AllSafe user",
      });
    } catch (error) {
      await user.delete();
      return res.status(500).send({ success: false, message: error });
    }
  } catch (error) {
    res.status(400).send({ success: false, message: error });
  }
};

export const confirmEmail = async (req, res, next) => {
  try {
    const confirmEmailToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      confirmEmailToken: confirmEmailToken,
    });
    if (!user)
      return res
        .status(400)
        .send("Confirm Email Token is Invalid or has been Expired");

    user.confirmEmailToken = undefined;
    user.verified = true;

    await user.save();
    sendAuthToken(user, 200, res);
  } catch (error) {
    res.status({ success: false, message: error });
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).send({
        success: false,
        message: `User with email ${email} not found`,
      });
    }

    if (!user.verified.email)
      return res
        .status(404)
        .send({ success: false, message: "Please verify your email first" });

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res
        .status(401)
        .send({ success: false, message: "Invalid email or password" });
    }

    await sendAuthToken(user, 200, res);
  } catch (error) {
    res.status(400).send({ success: false, message: error });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res
        .status(401)
        .send({ success: false, message: "User not found" });
    }
    const resetToken = await user.generateResetPasswordToken();

    const message = `Your password reset token s: \n\n ${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "AllSafe Password Recovery",
        message,
      });

      res.status(200).send({
        success: true,
        resetToken,
        message: "Reset password token sent successfully",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).send({ success: false, message: error });
    }
  } catch (error) {
    res.status(500).send({ success: false, message: error });
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.body.resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user)
      return res.status(400).send({
        success: false,
        message: "Reset Password Token is Invalid or has been Expired",
      });

    if (req.body.password !== req.bosy.confirmPassword) {
      return res
        .status(400)
        .send({ success: false, message: "Password does not match" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res
      .status(200)
      .send({ success: true, message: "Reset password done successfully" });
  } catch (error) {
    res.status(400).send({ success: false, message });
  }
};

export const logout = async (req, res, next) => {
  try {
    req.flash("success", "Successfully Logged Out");

    const cookies = Object.keys(req.cookies);
    cookies.forEach((cookie) => {
      res.clearCookie(cookie);
    });

    req.logout(() => {
      res.status(200).send({ success: true, message: "Logout Successful" });
    });
  } catch (error) {
    res.status(400).send({ success: false });
  }
};

export const getUserInfo = async (req, res, next) => {
  try {
    res
      .status(200)
      .send({ success: true, user: req.user, message: "User found" });
  } catch (error) {
    res.status(400).status({ success: false });
  }
};

export const authLogin = async (req, res, next) => {
  const { user } = req;
  if (user) {
    console.log("USER:", user.fullName);
    await sendAuthToken(user, 200, res);
  } else {
    res.redirect("/auth/login/failed");
  }
};

export const authLogout = async (req, res, next) => {
  req.flash("success", "Successfully Logged Out");
  sessionStorage.clear();
  req.logout(() => {
    res.redirect("http://127.0.0.1:3000");
  });
};
