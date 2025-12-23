import { Router } from "express";
const routes = Router()
import settingController from '../settings/setting.controller'
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/', adminAuthentication, asyncWrap(settingController.add))
routes.get('/get', adminAuthentication, asyncWrap(settingController.list))
// routes.post('/edit/:id', adminAuthentication, asyncWrap(settingController.edit))

export default routes;