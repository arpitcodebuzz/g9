import { Router } from "express";
const routes = Router()
import productController from "./productSaved.controller";
import asyncWrap from 'express-async-wrapper'
import authenticate from '../common/middleware/authenticate'

routes.post('/add',authenticate,asyncWrap(productController.add))
routes.get('/list',authenticate,asyncWrap(productController.list))
routes.delete('/delete', authenticate, asyncWrap(productController.delete));

routes.post('/movetoCart',authenticate,asyncWrap(productController.movetoCart))

export default routes