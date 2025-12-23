import { Router } from "express";
const routes = Router()
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";
import newArrivalController from './newArrival.controller'
import upload from '../../common/helpers/multer'
import exploreDto from '../explore-collection/dto/explore.dto'
import validator from "../../common/config/joi-validator";

routes.post('/add', adminAuthentication, validator.body(exploreDto), upload.single('newArrival'), asyncWrap(newArrivalController.add))

routes.get('/list', adminAuthentication, asyncWrap(newArrivalController.list))

routes.delete('/delete/:id', adminAuthentication, asyncWrap(newArrivalController.delete))

routes.get('/detail/:id', adminAuthentication, asyncWrap(newArrivalController.detail))
routes.post('/edit/:id', adminAuthentication, upload.single('newArrival'), asyncWrap(newArrivalController.edit))




export default routes;