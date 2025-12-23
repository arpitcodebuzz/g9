import Joi from 'joi'

const schema = Joi.object({
  address_line_1: Joi.string().required(),
  address_line_2: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  address_type: Joi.string().required(),
  postal_code: Joi.string().required()
})

export default schema;