import knex from "../../common/config/database.config";
import faqResources from "./resource/faq.resource";

class faqService {
  async add(body) {
    try {
      const { question, answer } = body

       function startsWithCapital(str) {
        return /^[A-Z]/.test(str);
      }

      if (!startsWithCapital(question)) {
        return { 
          status: false,
           message: 'Question must start with a capital letter !' 
          };
      }

      //  if (!startsWithCapital(answer)) {
      //   return { 
      //     status: false,
      //      message: 'Answer must start with a capital letter !' 
      //     };
      // }

      const data = await knex('faqs').insert({
        question,
        answer
      })

      return {
        status: true,
        mesage: 'Faq inserted successfully !!'
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        mesage: 'Something went wrong !!'
      }
    }
  }

  async list() {
    try {
      const data = await knex('faqs').select().orderBy('createdAt', 'desc');
      if (!data) {
        return {
          status: true,
          mesage: 'No data found !!'
        }
      }
      const faqData = data.map((data) => new faqResources(data))
      return {
        status: true,
        mesage: 'Faq list fetched successfully !!',
        data: faqData
      }

    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        mesage: 'Something went wrong !!'
      }
    }
  }

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('faqs').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }

      await knex('faqs').where({ id }).del()
      return {
        status: true,
        mesage: 'Faq deleted successfully !!'
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        mesage: 'Something went wrong !!'
      }
    }
  }

  async detail(params) {
    try {
      const { id } = params
      const data = await knex('faqs').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }

      const faqData = new faqResources(data)

      return {
        status: true,
        mesage: 'Faq fetched successfully with id !!',
        data: faqData
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        mesage: 'Something went wrong !!'
      }
    }
  }

  async edit(params, body) {
    try {
      const { id } = params
      const { question, answer } = body

      const data = await knex('faqs').where({ id }).first()
      if (!data) {
        return {
          status: false,
          mesage: 'No data found !!'
        }
      }

      const updateData = {
        question: question && question.trim() !== "" ? question : data.question,
        answer: answer && answer.trim() !== "" ? answer : data.answer
      };


      await knex('faqs').where({ id }).update(updateData)
      return {
        status: true,
        mesage: 'Faq data updated successfully !!',
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        mesage: 'Something went wrong !!'
      }
    }
  }
}

export default new faqService();