import { castToStorage } from "../../../common/helper";
import dotenv from "dotenv";
 
dotenv.config();
export default class blogResource {
  constructor(data) {
    this.id = data.id
    this.title = data.title
    this.description = data.description
    this.image = data.image
      ? castToStorage('uploads/media/', data.image)
      : null
    this.redirectUrl = data.redirectUrl  
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}