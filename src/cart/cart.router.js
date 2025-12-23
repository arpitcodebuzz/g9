import { Router } from "express";
const routes = Router()
import cartController from '../cart/cart.controller'
import asyncWrap from 'express-async-wrapper'
import authenticate from "../common/middleware/authenticate";

routes.post('/add', authenticate, asyncWrap(cartController.add))
routes.get('/list', authenticate, asyncWrap(cartController.list))
routes.delete('/delete', authenticate, asyncWrap(cartController.delete));
routes.post('/cartQty', authenticate, asyncWrap(cartController.cartQty))



// order summary 

routes.get('/orderSummary', authenticate, asyncWrap(cartController.orderSummary))

export default routes;        