import { Router } from "express";
const routes = Router()
import stoneShapeController from "./stoneShape.controller";
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/add',adminAuthentication,asyncWrap(stoneShapeController.add))
routes.get('/list',adminAuthentication,asyncWrap(stoneShapeController.list))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(stoneShapeController.delete))
routes.post('/edit/:id',adminAuthentication,asyncWrap(stoneShapeController.edit))
routes.get('/detail/:id',adminAuthentication,asyncWrap(stoneShapeController.detail))


export default routes;