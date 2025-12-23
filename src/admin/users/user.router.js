import { Router } from "express";
const routes = Router()
import userController from '../users/user.controller'
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from '../../common/middleware/admin-authentication.middleware'

routes.get('/list',adminAuthentication,asyncWrap(userController.list))
routes.get('/detail/:id',adminAuthentication,asyncWrap(userController.detail))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(userController.delete))
routes.post('/updateStatus/:id',adminAuthentication,asyncWrap(userController.updateStatus))


export default routes;