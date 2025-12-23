import { Router } from "express";
const routes = Router()
import productController from '../products/products.controller'
import asyncWrap from 'express-async-wrapper'


routes.get('/Categorylist', asyncWrap(productController.Categorylist))

routes.get('/subCategoryList', asyncWrap(productController.subCategoryList))

routes.get('/productList', asyncWrap(productController.productList))

routes.get('/topSelling', asyncWrap(productController.topSelling))

routes.get('/getmetals', asyncWrap(productController.metalsList))

routes.get('/getStoneShape', asyncWrap(productController.getStoneShape))

routes.get('/getgoldPurity', asyncWrap(productController.getgoldPurity))

routes.get('/detail/:id', asyncWrap(productController.detail))

routes.get('/priceFilter', asyncWrap(productController.priceFilter))



export default routes;  