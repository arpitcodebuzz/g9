import { Router } from "express";
const routes = Router()
import contactController from "./contact.controller";
import asyncWrap from 'express-async-wrapper'
import validator from "../common/config/joi-validator";
import contactDto from '../contact-us/dto/contact.dto'
import upload from "../common/helpers/multer";
import authenticate from "../common/middleware/authenticate";

routes.post('/add',authenticate,validator.body(contactDto), asyncWrap(contactController.add))

export default routes;