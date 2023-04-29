import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const isUserAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res
                .status(401)
                .send({ success: false, message: 'Login to access this resource'});
        }

        const decodedId = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decodedId.id);

        if (!user)
            return res  
                .status(200)
                .send({ sucess: false, message: 'User not found' });

        req.user = user;
        req.token = token;
    } catch (error) {
        res.status(400).send({ success: false, error: error });   
    }
    next();
};

export const isAuthenticatedUser = (req, res, next) => {
    if (req.user) next();
    else
        res.status(401).send({
            success: false,
            message: 'Login to access this resource',
        });
};