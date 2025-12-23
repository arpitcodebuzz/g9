import { Router } from "express";
const routes = Router()
import orderController from '../orders/order.controller'
import authenticate from "../common/middleware/authenticate";
import upload from "../common/helpers/multer";

routes.get('/list', authenticate, orderController.list)


routes.post('/addressDetail', authenticate, orderController.addressDetail)

routes.get('/details/:orderId', authenticate, orderController.details)

routes.post('/Cancelled', authenticate, orderController.Cancelled)

routes.get('/alldetails/:orderId', authenticate, orderController.alldetails)




routes.post("/create-invoice", authenticate, orderController.createInvoice);

routes.get('/getInvoice', authenticate, orderController.getInvoice)

routes.post("/download-invoice", authenticate, orderController.downloadInvoice);
      


export default routes;