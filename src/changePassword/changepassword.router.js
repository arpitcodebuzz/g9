import { Router } from "express";
const routes = Router()
import changepasswordClt from '../changePassword/changepassword.controller'
import asyncWrap from 'express-async-wrapper'
import authenticate from "../common/middleware/authenticate";

routes.post('/changePassword',authenticate,asyncWrap(changepasswordClt.changePassword))

export default routes;