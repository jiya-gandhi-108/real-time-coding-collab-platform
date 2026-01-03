const jwt = require("jsonwebtoken");

module.exports = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.user = { name: "Guest" };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = {
      id: decoded.id,
      name: decoded.name || decoded.username || decoded.email,
    };

    next();
  } catch (err) {
    socket.user = { name: "Guest" };
    next();
  }
};
