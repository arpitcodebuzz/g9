import Joi from 'joi'

const schema = Joi.object({
   name: Joi.string().required(),
   email_mobileNo: Joi.string().required(),
   service: Joi.string().required(),
   serviceType: Joi.string().required(),
   message: Joi.string().allow('').optional()

})

export default schema

