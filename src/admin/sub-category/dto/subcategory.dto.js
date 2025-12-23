import Joi from 'joi'

const schema = Joi.object({
   categoryId: Joi.number().integer().required(),
   name:Joi.string().required()
})

export default schema;