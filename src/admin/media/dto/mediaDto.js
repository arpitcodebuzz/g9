import Joi from 'joi'

const schema = Joi.object({
   title:Joi.string().required(),
   redirectUrl:Joi.string().required(),
   description:Joi.string().required(),
   
})

export default schema;