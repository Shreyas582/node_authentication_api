import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import methodOverride from "method-override";

import userRoutes from './api/routes/userRoutes.js';

import ErrorMiddleware from './api/middlewares/ErrorMiddleware.js';

dotenv.config({ path: 'server/config/config.env' });

const app = express()

app.use(express.json());

const corsOptions = {
    origin: true,
    credentials: true,
};

app.use(cors(corsOptions));

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(bodyParser.json());
app.use(cookieParser());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method == "OPTIONS") {
        res.header(
            "Access-Control-Allow-Methods",
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE"
        );
        return res.status(200).json({});
    }
    next();
});

app.use(ErrorMiddleware);

app.use('/api/v1', userRoutes);

// app.use((req, res, next) => {
//     const error = new Error("Not Found!");
//     error.status = 404;
//     next(error);
// });

// app.use((error, req, res, next) => {
//     res.status(error.status || 500);
//     res.json({
//         error: {
//             message: error.message,
//         },
//     });
// });

export default app;