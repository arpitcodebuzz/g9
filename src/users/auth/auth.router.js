import { Router } from "express";
const routes = Router()
import authController from '../auth/auth.controller'
import asyncWrap from 'express-async-wrapper'
import validator from "../../common/config/joi-validator";
import authDto from '../auth/dto/dto.config'
import userDto from '../auth/dto/user_address.dto'
import authenticate from '../../common/middleware/authenticate'

routes.post('/signUp', validator.body(authDto), asyncWrap(authController.signUp))

routes.post('/signUpWithGoogle', asyncWrap(authController.signUpWithGoogle))

routes.post('/otpMethod',asyncWrap(authController.otpMethod))

routes.post('/otpVerification', asyncWrap(authController.otpVerification))

// routes.post('/MobileOtpVerification',asyncWrap(authController.MobileOtpVerification))

routes.post('/userAddress', authenticate, validator.body(userDto), asyncWrap(authController.userAddress))

routes.post('/signIn', asyncWrap(authController.signIn))

routes.post('/signInOrSignUpWithGoogle', asyncWrap(authController.signInOrSignUpWithGoogle))

routes.post('/forgetPassword', asyncWrap(authController.forgetPassword))

routes.post('/changePassword',authenticate,asyncWrap(authController.changePassword))

routes.post('/resendOtp', asyncWrap(authController.resendOtp))

routes.get('/signOut',authenticate,asyncWrap(authController.signOut))

export default routes;