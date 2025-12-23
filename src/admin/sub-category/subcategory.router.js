import { Router } from "express";
const routes = Router()
import subCategoryClt from '../sub-category/subcategory.controller'
import asyncWrap from 'express-async-wrapper'
import subcategoryDto from '../sub-category/dto/subcategory.dto'
import validator from "../../common/config/joi-validator";
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";

routes.post('/add',adminAuthentication,validator.body(subcategoryDto),asyncWrap(subCategoryClt.add))
routes.get('/list',adminAuthentication,asyncWrap(subCategoryClt.list))
routes.delete('/delete/:id',adminAuthentication,asyncWrap(subCategoryClt.delete))
routes.post('/edit/:id',adminAuthentication,asyncWrap(subCategoryClt.edit))
routes.get('/detail/:id',adminAuthentication,asyncWrap(subCategoryClt.detail))

export default routes;