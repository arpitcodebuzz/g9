import { Router } from "express";
const routes = Router()
import complaintController from '../complaint-Query/complaint.controller'
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";


routes.get('/list',adminAuthentication,asyncWrap(complaintController.list))
routes.get('/detail/:id',adminAuthentication,asyncWrap(complaintController.detail))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(complaintController.delete))

export default routes;