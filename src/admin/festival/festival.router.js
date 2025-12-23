import { Router } from "express";
const routes = Router()
import festivalController from '../festival/festival.controller'
import upload from "../../common/helpers/multer";
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/add',adminAuthentication,upload.single('festival'),asyncWrap(festivalController.add))

routes.get('/list',adminAuthentication,asyncWrap(festivalController.list))

routes.delete('/delete/:id',adminAuthentication,asyncWrap(festivalController.delete))


export default routes;