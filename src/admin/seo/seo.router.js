import { Router } from "express";
const routes = Router()
import seoController from '../seo/seo.controller'
import asyncWrap from 'express-async-wrapper';
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/add',adminAuthentication,asyncWrap(seoController.add))
routes.get('/list',adminAuthentication,asyncWrap(seoController.list))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(seoController.delete))
routes.post('/edit/:id',adminAuthentication,asyncWrap(seoController.edit))
routes.get('/detail/:id',adminAuthentication,asyncWrap(seoController.detail))

export default routes;