import { Router } from "express";
const routes = Router()
import faqController from '../faq/faq.controller'
import validator from "../../common/config/joi-validator";
import faqDto from '../faq/dto/faq.dto'
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/add',adminAuthentication,validator.body(faqDto),asyncWrap(faqController.add))
routes.get('/list',adminAuthentication,asyncWrap(faqController.list))
routes.delete('/delete/:id',asyncWrap(faqController.delete))
routes.get('/detail/:id',adminAuthentication,asyncWrap(faqController.detail))
routes.post('/edit/:id',adminAuthentication,asyncWrap(faqController.edit))


export default routes;