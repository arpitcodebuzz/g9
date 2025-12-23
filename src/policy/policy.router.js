import { Router } from "express";
const routes = Router()
import asyncWrap from 'express-async-wrapper'
import policyController from './policy.controller'


routes.get('/list',asyncWrap(policyController.list))


export default routes;