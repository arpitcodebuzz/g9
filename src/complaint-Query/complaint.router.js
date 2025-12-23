import { Router } from "express";
const routes = Router()
import asyncWrap from 'express-async-wrapper'
import validator from "../common/config/joi-validator";
import upload from "../common/helpers/multer";
import complaintController from "./complaint.controller";
import complaintDto from '../complaint-Query/dto/complaint.dto'
import authenticate from "../common/middleware/authenticate";

routes.post('/add', authenticate, upload.fields([{ name: 'complaintImage', maxCount: 5 }, { name: 'complaintVideo', maxCount: 2 }]), validator.body(complaintDto), asyncWrap(complaintController.add)
);

export default routes;