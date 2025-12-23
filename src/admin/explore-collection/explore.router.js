import { Router } from "express";
const routes = Router()
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";
import exploreController from '../explore-collection/explore.controller'
import upload from '../../common/helpers/multer'
import exploreDto from '../explore-collection/dto/explore.dto'
import validator from "../../common/config/joi-validator";

routes.post('/add',adminAuthentication,validator.body(exploreDto),upload.single('exploreImg'),asyncWrap(exploreController.add))

routes.get('/list',adminAuthentication,asyncWrap(exploreController.list))

routes.delete('/delete/:id', adminAuthentication, asyncWrap(exploreController.delete))

routes.get('/detail/:id', adminAuthentication, asyncWrap(exploreController.detail))
routes.post('/edit/:id', adminAuthentication, upload.single('exploreImg'), asyncWrap(exploreController.edit))




export default routes;