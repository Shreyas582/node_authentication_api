import express from 'express';
import { isUserAuthenticated } from '../middlewares/check-auth.js';

import {
    registerUser,
    confirmEmail,
    loginUser,
    forgotPassword,
    resetPassword,
    logout,
    getUserInfo,
} from '../controllers/userController.js';

const router = express.Router();

router.route('/register').post(registerUser);
router.route('/verification/email/:token').get(confirmEmail);
router.route('/login').post(loginUser);

router.route('/forgot/password').post(forgotPassword);
router.route('/reset/password').post(resetPassword);

router.route('/logout').get(isUserAuthenticated, logout);

router.route("/auth/login/success").get(isUserAuthenticated, getUserInfo);

router.route("/auth/login/failed").get(async (req, res, next) => {
    res.status(400).send({ success: false, message: "Login failed"});
})

export default router;