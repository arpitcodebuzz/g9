import { Router } from "express";
const routes = Router()
import askPriceController from './ask-price.controller'
import asyncWrap from 'express-async-wrapper'
import authenticate from "../common/middleware/authenticate";
import upload from "../common/helpers/multer";

routes.get("/gold-type", asyncWrap(askPriceController.goldType))
routes.get("/diamond-type", asyncWrap(askPriceController.diamondType))

routes.post('/', upload.single('askpriceImg'), asyncWrap(askPriceController.askPrice))
routes.get('/get/:id', asyncWrap(askPriceController.getAskprice))

export default routes;