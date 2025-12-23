import knex from "../../common/config/database.config";
import dotenv from "dotenv";
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";
dotenv.config();
import path from 'path'
import fs from 'fs'
import { converter } from "../../common/config/productImage.config";


class festivalService {
  async add(file) {
    try {
      // console.log(file,'file')
      // const image = file ? file.filename : null
      if (!file) {
        return {
          status: false,
          message: 'Image is required !!'
        }
      }

      // const awsUpload = await uploadToS3([file]);

      // if (!awsUpload) {
      //   return {
      //     status: false,
      //     message: 'Image not added !!'
      //   }
      // }
      const convert = await converter([file]);
      console.log("🚀 ~ blogService ~ add ~ convert:", convert)
      const image = convert.length > 0 ? convert[0].filename : null;

      await knex('festival').insert({
        image: image
      })

      return {
        status: true,
        message: 'Image added successfully !!'
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

  async list() {
    try {
      const data = await knex('festival').select().orderBy('createdAt', 'desc')
      if (!data) {
        return {
          status: false,
          message: 'image not found !!'
        }
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;
      const image = data.map(item => ({
        ...item,
        image: item.image ? `${baseUrl}/uploads/festival/${item.image}` : null
      }))


      return {
        status: true,
        message: 'Image fetched successfully !!',
        data: image
      }

    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Something went wrong '
      }
    }
  }

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('festival').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'Data not found !!'
        }
      }

      if (data.image) {
        const fullpath = path.join(process.cwd(), 'public/uploads/festival', data.image)
        // if (fs.existsSync(fullpath)) fs.unlinkSync(fullpath)
        deleteFromS3(`public/uploads/festival/${data.image}`)
      }

      await knex('festival').where({ id }).del()
      return {
        status: true,
        message: 'Image deleted successfully !!'
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

export default new festivalService()