import Joi from 'joi'

const schema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
  rolename: Joi.string().required(),
  access: Joi.string().required()
})

export default schema;