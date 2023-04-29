import mongoose from 'mongoose';
mongoose.set('strictQuery', true);

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`[*] MongoDB connected with server: ${connect.connection.host}`);
    } catch (error) {
        console.log(`[*] ERROR: ${error}`);
    }
};

export default connectDB;