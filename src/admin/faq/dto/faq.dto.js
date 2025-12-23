import Joi from "joi";

const schema = Joi.object({
  question: Joi.string().required(),
  answer: Joi.string().required()
})

export default schema;