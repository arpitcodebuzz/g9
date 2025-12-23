import { Router } from "express";
import paymentController from '../payment/payment.controller'
import authenticate from "../common/middleware/authenticate";
const routes = Router()

routes.post('/fetch', authenticate, paymentController.fetch)




export default routes;