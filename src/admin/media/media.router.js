import { Router } from "express";
const routes = Router()
import mediaController from './media.controller'
import asyncWrap from 'express-async-wrapper'
import upload from "../../common/helpers/multer";
import mediaDto from './dto/mediaDto'
import validator from "../../common/config/joi-validator";
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";


routes.post('/add',adminAuthentication,upload.single('mediaImage'),validator.body(mediaDto),asyncWrap(mediaController.add))
routes.get('/list',adminAuthentication,asyncWrap(mediaController.list))
routes.get('/detail/:id',adminAuthentication,asyncWrap(mediaController.detail))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(mediaController.delete))
routes.post('/edit/:id',adminAuthentication,upload.single('mediaImage'),asyncWrap(mediaController.edit))

export default routes;