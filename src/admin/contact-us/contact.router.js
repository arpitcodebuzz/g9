import { Router } from "express";
const routes = Router()
import contactController from '../contact-us/contact.controller'
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";


routes.get('/list',adminAuthentication,asyncWrap(contactController.list))
routes.get('/detail/:id',adminAuthentication,asyncWrap(contactController.detail))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(contactController.delete))

export default routes;