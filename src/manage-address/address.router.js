import { Router } from "express";
const routes = Router()
import addressController from '../manage-address/address.controller'
import asyncWrap from 'express-async-wrapper'
import authenticate from "../common/middleware/authenticate";

routes.get('/list',authenticate,asyncWrap(addressController.list))
routes.post('/setPrimary/:id',asyncWrap(addressController.setPrimary))
routes.delete('/delete/:id',asyncWrap(addressController.delete))
routes.post('/edit/:id',asyncWrap(addressController.edit))

export default routes;