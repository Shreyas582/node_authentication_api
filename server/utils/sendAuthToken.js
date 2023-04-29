const sendAuthToken = async (user, statusCode, res) => {
    const token = await user.getJwtToken();
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: true,
    };

    res
        .cookie('token', token, options)
        .status(statusCode)
        .redirect(`http://${process.env.HOST}:3000/home`);
};

export default sendAuthToken;