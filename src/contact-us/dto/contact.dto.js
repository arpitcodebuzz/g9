import Joi from 'joi'

const schema = Joi.object({
    name: Joi.string().required(),
    email_mobileNo: Joi.string().required(),
    message: Joi.string().optional().allow('')

})

export default schema;