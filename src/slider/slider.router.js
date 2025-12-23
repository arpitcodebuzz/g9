import { Router } from "express";
const routes = Router()
import sliderController from '../slider/slider.controller'
import asyncWrap from 'express-async-wrapper'

routes.get('/list',asyncWrap(sliderController.list))

export default routes;