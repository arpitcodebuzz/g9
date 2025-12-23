import { Router } from "express";
const routes = Router()
import accountController from '../account-overview/account.controller'
import asyncWrap from 'express-async-wrapper'
import authenticate from "../common/middleware/authenticate";
import upload from "../common/helpers/multer";

routes.get('/userData', authenticate, asyncWrap(accountController.list))

routes.post('/edit', authenticate, upload.single("profile"), asyncWrap(accountController.edit))

routes.get('/userAddress', authenticate, asyncWrap(accountController.userAddress))

export default routes;    