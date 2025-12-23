import { Router } from "express";
const routes = Router()
import categoryController from '../category/category.controller';
import asyncWrap from 'express-async-wrapper';
import categoryDto from '../category/dto/category.dto';
import validator  from "../../common/config/joi-validator";
import adminAuthentication from '../../common/middleware/admin-authentication.middleware';

routes.post('/add',adminAuthentication,validator.body(categoryDto),asyncWrap(categoryController.add))
routes.get('/list',adminAuthentication,asyncWrap(categoryController.list))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(categoryController.delete))
routes.post('/edit/:id',adminAuthentication,asyncWrap(categoryController.edit))
routes.get('/detail/:id',adminAuthentication,asyncWrap(categoryController.detail))
routes.post('/updateStatus/:id',adminAuthentication,asyncWrap(categoryController.updateStatus))

export default routes;