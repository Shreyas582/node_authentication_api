import app from './app.js';
import dotenv from 'dotenv';

import connectDB from './db/db.js';

dotenv.config({ path: "server/config/config.env" });

connectDB();

const server = app.listen(process.env.PORT, () => {
    console.log(`[*] Server is running on port ${process.env.PORT}`);
});