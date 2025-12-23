import jwt from 'jsonwebtoken';
import knex from '../config/database.config'

const adminAuthentication = async (req, res, next) => {
  // console.log(req.headers.authorization, "<-- adminAuthentication")
  if (!req.headers.authorization) {
    return res.status(401).json({
      status: false,
      message: 'Unauthorized access please pass the token !!'
    });
  }

  const token = req.headers.authorization.split(' ')[1];
  // console.log("🚀 ~ adminAuthentication ~ token:", token)
  if (!token) {
    return res.json({ status: false, message: 'unauthorized access Invalid token !!' })
  }

  const decodeJwtToken = await jwt.decode(token);
  if (!decodeJwtToken) {
    return res.status(401).json({
      status: false,
      message: 'Unauthorized access Invalid token !!'
    });
  }
  return next();

}

export default adminAuthentication;