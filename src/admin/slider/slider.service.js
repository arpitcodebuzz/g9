import knex from "../../common/config/database.config";
import dotenv from "dotenv";
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";
import { converter } from "../../common/config/productImage.config";
dotenv.config();
import path from 'path'
import fs from 'fs'

class sliderService {
  async add(body, file) {
    try {
      // console.log(file,'file')
      const { categoryId, subcategoryId } = body
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
      //     message: 'Silder not added !!'
      //   }
      // }
      const convert = await converter([file]);
      console.log("🚀 ~ blogService ~ add ~ convert:", convert)
      const image = convert.length > 0 ? convert[0].filename : null;

      await knex('slider').insert({
        slider: image,
        categoryId,
        subcategoryId
      })

      return {
        status: true,
        message: 'Slider added successfully !!'
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
      const data = await knex('slider as sl')
        .leftJoin('category as c', 'sl.categoryId', 'c.id')
        .leftJoin('subcategory as s', 'sl.subcategoryId', 's.id')
        .select(
          'sl.*',
          'c.id as category_id',
          'c.name as category_name',
          's.id as subcategory_id',
          's.name as subcategory_name'
        )
        .orderBy('sl.createdAt', 'desc');

      if (!data || data.length === 0) {
        return {
          status: true,
          message: 'Slider not found !!',
          data: []
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const formattedData = data.map(item => ({
        id: item.id,

        category: item.category_id ? {
          id: item.category_id,
          name: item.category_name
        } : null,

        subcategory: item.subcategory_id ? {
          id: item.subcategory_id,
          name: item.subcategory_name
        } : null,

        slider: item.slider
          ? `${baseUrl}/uploads/slider/${item.slider}`
          : null,

        createdAt: item.createdAt
      }));

      return {
        status: true,
        message: 'Slider fetched successfully !!',
        data: formattedData
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong'
      };
    }
  }


  async delete(params) {
    try {
      const { id } = params
      const data = await knex('slider').where({ id }).first()
      console.log("🚀 ~ sliderService ~ delete ~ data:", data)
      if (!data) {
        return {
          status: false,
          message: 'Data not found !!'
        }
      }

      if (data.slider) {
        const fullpath = path.join(process.cwd(), 'public/uploads/slider', data.slider)
        // fs.unlinkSync(fullpath)
        deleteFromS3(`public/uploads/slider/${data.slider}`)
      }

      await knex('slider').where({ id }).del()
      return {
        status: true,
        message: 'Slider deleted successfully !!'
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

export default new sliderService()