import { Router } from "express";
const routes = Router()
import orderController from './order.controller'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.get('/list', adminAuthentication, orderController.list)

routes.post('/subInvoice', adminAuthentication, orderController.subInvoice)

routes.get('/listOrder/:userId', adminAuthentication, orderController.listOrder)

routes.get('/detail/:orderId', adminAuthentication, orderController.detail)

routes.post("/share-invoice", adminAuthentication, orderController.shareInvoice);

routes.post("/download-invoice", adminAuthentication, orderController.downloadInvoice);

routes.post("/download-Subinvoice", adminAuthentication, orderController.downloadSubInvoice);

routes.get('/getInvoice', adminAuthentication, orderController.getInvoice)

routes.get('/getSubInvoice/:mainInvoiceId', adminAuthentication, orderController.getSubInvoice)

routes.post('/changeProductStatus', adminAuthentication, orderController.changeProductStatus);


export default routes;