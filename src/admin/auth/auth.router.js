import { Router } from "express";
const routes = Router()
import authController from '../auth/auth.controller'
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/login',asyncWrap(authController.login))
routes.get('/dashboard',adminAuthentication,asyncWrap(authController.dashboard))

export default routes;