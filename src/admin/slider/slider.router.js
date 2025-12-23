import { Router } from "express";
const routes = Router()
import sliderController from '../slider/slider.controller'
import upload from "../../common/helpers/multer";
import asyncWrap from 'express-async-wrapper'

routes.post('/add',upload.single('slider'),asyncWrap(sliderController.add))

routes.get('/list',asyncWrap(sliderController.list))

routes.delete('/delete/:id',asyncWrap(sliderController.delete))


export default routes;