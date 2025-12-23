import { castToStorage } from "../../common/helper";
import dotenv from "dotenv";
 
dotenv.config();
export default class contactResource {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.email_mobileNo = data.email_mobileNo
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
