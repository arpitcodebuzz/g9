import { Router } from "express";
const routes = Router()
import rolesController from '../roles/roles.controller'
import asyncWrap from 'express-async-wrapper';
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";
import validator from "../../common/config/joi-validator";
import rolesDto from '../roles/dto/role.dto'

routes.post('/add',adminAuthentication,validator.body(rolesDto),asyncWrap(rolesController.add))
routes.get('/list',adminAuthentication,asyncWrap(rolesController.list))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(rolesController.delete))
routes.post('/edit/:id',adminAuthentication,asyncWrap(rolesController.edit))

routes.post('/login',asyncWrap(rolesController.login))

routes.post('/updateStatus',adminAuthentication,asyncWrap(rolesController.updateStatus))


export default routes;