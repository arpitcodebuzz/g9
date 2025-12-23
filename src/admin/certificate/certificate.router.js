import { Router } from "express";
const routes = Router()
import certificateController from '../certificate/certificate.controller'
import validator from "../../common/config/joi-validator";
import certificateDto from '../certificate/dto/certificate.dto'
import asyncWrap from 'express-async-wrapper'
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";
import upload from "../../common/helpers/multer";

routes.post('/add', adminAuthentication, validator.body(certificateDto), upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]), asyncWrap(certificateController.add))

routes.get('/list', adminAuthentication, asyncWrap(certificateController.list))

routes.delete('/delete/:id', adminAuthentication, asyncWrap(certificateController.delete))

routes.get('/detail/:id', adminAuthentication, asyncWrap(certificateController.detail))
routes.post('/edit/:id', adminAuthentication, upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'logo', maxCount: 1 }]),
  asyncWrap(certificateController.edit))

export default routes;