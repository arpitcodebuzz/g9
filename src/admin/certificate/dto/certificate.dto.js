import Joi from "joi";

const schema = Joi.object({
  title: Joi.string().required(),
  subtitle: Joi.string().required()
})

export default schema;