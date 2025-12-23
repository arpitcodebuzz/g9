import { Router } from "express";
const routes = Router()
import blogController from '../blogs/blogs.controller'
import asyncWrap from 'express-async-wrapper'
import upload from "../../common/helpers/multer";
import blogDto from '../blogs/dto/blogDto.config'
import validator from "../../common/config/joi-validator";
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";


routes.post('/add',adminAuthentication,upload.single('blogImage'),validator.body(blogDto),asyncWrap(blogController.add))
routes.get('/list',adminAuthentication,asyncWrap(blogController.list))
routes.get('/detail/:id',adminAuthentication,asyncWrap(blogController.detail))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(blogController.delete))
routes.post('/edit/:id',adminAuthentication,upload.single('blogImage'),asyncWrap(blogController.edit))

export default routes;