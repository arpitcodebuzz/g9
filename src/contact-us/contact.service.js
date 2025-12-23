import knex from '../common/config/database.config'
import contactResource from './resources/contact.resource';
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()
import { sentData } from '../common/config/nodemailer.config'

class contactService {
  async add(body, files,authUser) {
    try {
      const { name, email_mobileNo, message } = body

      // const image = files?.contactImage?.[0]?.filename || null;
      // const video = files?.contactVideo?.[0]?.filename || null;

      await knex('contact_us').insert({
        name,
        email_mobileNo: email_mobileNo ? email_mobileNo : null,
        message: message ? message : null,
        userId:authUser.id
      })

      await sentData(name, email_mobileNo, message)

      return {
        status: true,
        message: 'Contact us data added successfully !!'
      }

    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Something went wrong !!'
      }
    }
  }


}

export default new contactService()