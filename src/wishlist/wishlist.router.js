import { Router } from "express";
const routes = Router()
import wishlistController from "../wishlist/wishlist.controller";
import asyncWrap from 'express-async-wrapper'
import authenticate from '../common/middleware/authenticate'

routes.post('/add', authenticate, asyncWrap(wishlistController.add));
routes.get('/list',authenticate,asyncWrap(wishlistController.list))

routes.delete('/delete', authenticate, asyncWrap(wishlistController.delete));

export default routes