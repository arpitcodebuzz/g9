import { Router } from "express";
const routes = Router()
import policyController from '../policy/policy.controller'
import asyncWrap from 'express-async-wrapper';
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";
import validator from "../../common/config/joi-validator";
import policyDto from '../policy/dto/policy.dto'

routes.post('/add',adminAuthentication,validator.body(policyDto),asyncWrap(policyController.add))
routes.get('/list',adminAuthentication,asyncWrap(policyController.list))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(policyController.delete))
routes.post('/edit/:id',adminAuthentication,asyncWrap(policyController.edit))
routes.get('/detail/:id',adminAuthentication,asyncWrap(policyController.detail))


export default routes;