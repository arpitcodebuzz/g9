import { HTTP_UNAUTHORIZE } from "../../../constants.js";
import GeneralError from "./general-error";

class UnauthorizeException extends GeneralError {
  constructor(message) {
    super();
    this.message = message || "Unauthenticated.";
    this.status = HTTP_UNAUTHORIZE;
  }
}

export default UnauthorizeException;
