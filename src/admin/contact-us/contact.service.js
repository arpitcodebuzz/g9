import knex from '../../common/config/database.config'
import contactResource from '../../contact-us/resources/contact.resource'
import fs from 'fs'
import path from 'path'
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";


class contactService {
  async list(query) {
    try {
      const { perPage, page, startDate, endDate } = query
      const qb = knex('contact_us').select('id', 'name', 'email_mobileNo', 'message', 'createdAt', 'updatedAt').orderBy('createdAt', 'desc')

      if (startDate && endDate) {
        qb.whereBetween(knex.raw('DATE(createdAt)'), [startDate, endDate]);
      } else if (startDate) {
        qb.where(knex.raw('DATE(createdAt)'), '>=', startDate);
      } else if (endDate) {
        qb.where(knex.raw('DATE(createdAt)'), '<=', endDate);
      }

      const data = await qb.paginate({
        perPage: perPage ? parseInt(perPage) : 10,
        currentPage: page ? parseInt(page) : 1,
        isLengthAware: true
      })

      if (!data || data.length === 0) {
        return {
          status: false,
          message: 'No data found !!'
        };
      }

      // const baseUrl = process.env.PRODUCT_BASE_URL || 'http://localhost:5001';

      // const contactData = data.data.map(data => ({
      //   ...data,
      //   image: data.image
      //     ? `${baseUrl}/uploads/contactUs/${data.image}`
      //     : null,
      //   video: data.video
      //     ? `${baseUrl}/uploads/contactUs/${data.video}`
      //     : null
      // }));

      return {
        status: true,
        message: 'Contact list fetched successfully !!',
        data: data
      };
    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async detail(params) {
    try {
      const { id } = params;

      const data = await knex('contact_us').where({ id }).first();

      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL || 'http://localhost:5001';

      const contactData = {
        ...data,
        image: data.image
          ? `${baseUrl}/uploads/contactUs/${data.image}`
          : null,
        video: data.video
          ? `${baseUrl}/uploads/contactUs/${data.video}`
          : null
      };

      return {
        status: true,
        message: 'Contact list fetched successfully !!',
        data: contactData
      };
    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('contact_us').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        }
      }

      if (data.image) {
        const imagepath = path.join('public/uploads/contactUs', data.image)
        deleteFromS3(`public/uploads/contactUs/${data.image}`)
        // if (fs.existsSync(imagepath)) {
        //   fs.unlinkSync(imagepath)
        // }
      }

      if (data.video) {
        const videopath = path.join('public/uploads/contactUs', data.video)
        deleteFromS3(`public/uploads/contactUs/${data.video}`)
        // if (fs.existsSync(videopath)) {
        //   fs.unlinkSync(videopath)
        // }
      }

      await knex('contact_us').where({ id }).del()

      return {
        status: true,
        message: 'Contact data deleted successfully !!'
      }

    }
    catch (err) {
      console.log(err)
      return {
        status: true,
        message: 'Something went wrong !!'
      }
    }
  }

}


export default new contactService()