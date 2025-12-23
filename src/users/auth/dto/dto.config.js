import Joi from 'joi'

const schema = Joi.object({
  name:Joi.string().required(),
  email:Joi.string().required(),
  password:Joi.string().required(),
  Mobile_number:Joi.string().required(),
  ConfirmPassword:Joi.string().required(),
  registrationType:Joi.string().required()
})

export default schema;