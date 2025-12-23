import Joi from 'joi'

const schema = Joi.object({
   categoryId: Joi.number().integer().required(),
   subCategoryId: Joi.number().integer().required(),
   title: Joi.string().allow('').optional(),
   description: Joi.string().allow('').optional(),
   stockNumber: Joi.string().required(),
   metals: Joi.string().required(),
   stoneShapeId: Joi.string().required(),
   purity: Joi.string().required(),
   productMaterials: Joi.string().allow('').optional(),
   estimatedTime: Joi.string().required(),
   readyToShip: Joi.string().required(),
   discounted: Joi.string().required(),
   topSelling: Joi.string().required(),
   newArrival: Joi.string().required(),
   shortDescription: Joi.string().allow('').optional(),
   purity: Joi.string().required(),
   diamondCut: Joi.string().required()

})

export default schema

