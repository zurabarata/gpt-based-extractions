import app from '.';

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
server.timeout = 0;  // Disables the HTTP server timeout




