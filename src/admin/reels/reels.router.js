import { Router } from "express";
const routes = Router()
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";
import reelsController from '../reels/reels.controller'
import upload from '../../common/helpers/multer'
import validator from "../../common/config/joi-validator";

routes.post('/add', adminAuthentication,upload.single('reels'), asyncWrap(reelsController.add))

routes.get('/list', adminAuthentication, asyncWrap(reelsController.list))

routes.delete('/delete/:id', adminAuthentication, asyncWrap(reelsController.delete))




export default routes;