import dotenv from "dotenv";
 
dotenv.config();
export default class faqResources{
  constructor(data){
    this.id = data.id
    this.question = data.question
    this.answer = data.answer
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}