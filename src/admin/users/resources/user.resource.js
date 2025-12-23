import { castToStorage } from "../../../common/helper";
import dotenv from "dotenv";
 
dotenv.config();
export default class UserResource{
    constructor(data){
      this.id = data.id;
      this.name = data.name;
      this.email = data.email
      this.Mobile_number = data.Mobile_number
      this.registrationType = data.registrationType
      this.status = data.status;
      this.address_line_1 = data.address_line_1;
      this.address_line_2 = data.address_line_1;
      this.city = data.city;
      this.state = data.state;
      this.country = data.country;
      this.postal_code = data.postal_code;
      this.address_type = data.address_type

    }
}