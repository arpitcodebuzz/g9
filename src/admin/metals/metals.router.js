import { Router } from "express";
const routes = Router()
import metalsController from '../metals/metals.controller'
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/add',adminAuthentication,asyncWrap(metalsController.add))
routes.get('/list',adminAuthentication,asyncWrap(metalsController.list))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(metalsController.delete))
routes.post('/edit/:id',adminAuthentication,asyncWrap(metalsController.edit))
routes.get('/detail/:id',adminAuthentication,asyncWrap(metalsController.detail))


export default routes;