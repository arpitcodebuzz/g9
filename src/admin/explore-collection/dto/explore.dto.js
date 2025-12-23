import Joi from "joi";

const schema = Joi.object({
  image: Joi.string().required(),
  categoryId: Joi.string().required(),
  subcategoryId: Joi.string().required()
})

export default schema;