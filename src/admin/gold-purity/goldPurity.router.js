import { Router } from "express";
const routes = Router()
import goldPurityController from "./goldpurity.controller";
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/add',adminAuthentication,asyncWrap(goldPurityController.add))
routes.get('/list',adminAuthentication,asyncWrap(goldPurityController.list))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(goldPurityController.delete))
routes.post('/edit/:id',adminAuthentication,asyncWrap(goldPurityController.edit))
routes.get('/detail/:id',adminAuthentication,asyncWrap(goldPurityController.detail))


export default routes;