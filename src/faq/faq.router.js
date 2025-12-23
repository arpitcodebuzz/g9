import { Router } from "express";
const routes = Router()
import faqController from '../faq/faq.controller'
import asyncWrap from 'express-async-wrapper'
import authenticate from "../common/middleware/authenticate";

routes.get('/list', asyncWrap(faqController.list))



// policy list
routes.get('/listpolicy', asyncWrap(faqController.listpolicy))


export default routes;