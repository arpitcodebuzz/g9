import { Router } from "express";
const routes = Router()
import offerbarController from './offerbar.controller'
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/add',adminAuthentication,asyncWrap(offerbarController.add))
routes.get('/list',adminAuthentication,asyncWrap(offerbarController.list))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(offerbarController.delete))
routes.post('/edit/:id',adminAuthentication,asyncWrap(offerbarController.edit))
routes.get('/detail/:id',adminAuthentication,asyncWrap(offerbarController.detail))


export default routes;