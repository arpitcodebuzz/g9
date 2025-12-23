import { castToStorage } from "../../../common/helper";
import dotenv from "dotenv";
 
dotenv.config();

export default class productResource {
  constructor(data) {
    this.id = data.id
    this.categoryId = data.categoryId
    this.subCategoryId = data.subCategoryId
    this.title = data.title
    this.description = data.description
    this.stockNumber = data.stockNumber
    this.original_price = data.original_price
    this.selling_price = data.selling_price
    this.productMaterials = data.productMaterials
    this.estimatedTime = data.estimatedTime
    this.shortDescription = data.shortDescription
    this.images = data.images
      ? castToStorage('uploads/productmedia', data.images)
      : castToStorage('static/icon-7797704_640.png');  
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}