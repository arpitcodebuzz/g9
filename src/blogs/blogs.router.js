import { Router } from "express";
const routes = Router()
import blogsController from '../blogs/blogs.controller'
import asyncWrap from 'express-async-wrapper'
import authenticate from "../common/middleware/authenticate";

routes.get('/list', asyncWrap(blogsController.list))
routes.get('/detail/:id', asyncWrap(blogsController.detail))

export default routes;