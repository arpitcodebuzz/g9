import { castToStorage } from "../../../common/helper";
import dotenv from "dotenv";
 
dotenv.config();
export default class blogResource {
  constructor(data) {
    this.id = data.id
    this.title = data.title
    this.description = data.description
    this.image = data.image
      ? castToStorage('uploads/blogs/', data.image)
      : castToStorage('static/icon-7797704_640.png');

    
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}