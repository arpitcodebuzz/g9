import knex from "../../common/config/database.config";
import path from 'path'
import fs from 'fs'
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";
import { converter } from "../../common/config/productImage.config";


class exploreService {
  async add(body, file) {
    try {
      const { categoryId, subcategoryId } = body
      // console.log(body)
      const exploreImg = file ? file.filename : null
      // console.log(exploreImg)
      if (!exploreImg) {
        return {
          status: false,
          message: 'Image is required !!'
        }
      }

      // const awsUpload = await uploadToS3([file]);

      // if (!awsUpload) {
      //   return {
      //     status: false,
      //     message: 'exploreCollection not added !!'
      //   }
      // }
      const convert = await converter([file]);
      console.log("🚀 ~ blogService ~ add ~ convert:", convert)
      const image = convert.length > 0 ? convert[0].filename : null;

      await knex('exploreCollection').insert({
        categoryId,
        subcategoryId,
        image: image
      })

      return {
        status: true,
        message: 'explore collection added successfully !!'
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
      const data = await knex('exploreCollection as ec')
        .leftJoin('category as c', 'ec.categoryId', 'c.id')
        .leftJoin('subcategory as s', 'ec.subcategoryId', 's.id')
        .select(
          'ec.*',
          'c.id as category_id',
          'c.name as category_name',
          's.id as subcategory_id',
          's.name as subcategory_name'
        )
        .orderBy('ec.createdAt', 'desc');

      if (!data || data.length === 0) {
        return {
          status: true,
          message: 'explore Collection not found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const formattedData = data.map(item => ({
        id: item.id,

        category: {
          id: item.category_id,
          name: item.category_name
        },

        subcategory: {
          id: item.subcategory_id,
          name: item.subcategory_name
        },

        image: item.image
          ? `${baseUrl}/uploads/exploreImg/${item.image}`
          : null,

        createdAt: item.createdAt
      }));

      return {
        status: true,
        message: 'collection fetched successfully !!',
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

      const data = await knex('exploreCollection').where({ id }).first()

      if (!data) {
        return {
          status: false,
          message: 'explore collection not found !!'
        }
      }

      if (data.image) {
        const imagepath = path.join('public/uploads/exploreImg', data.image)
        // if (fs.existsSync(imagepath)) fs.unlinkSync(imagepath)
        deleteFromS3(`public/uploads/exploreImg/${data.image}`)
      }

      await knex('exploreCollection').where({ id }).del()

      return {
        status: true,
        message: 'exploreCollection deleted successfully !!'
      }

    } catch (err) {
      console.log(err)
      return { status: false, message: 'Something went wrong !!' }
    }
  }

  async detail(params) {
    try {
      const { id } = params
      const data = await knex('exploreCollection').where({ id }).first();

      if (!data) {
        return {
          status: false,
          message: 'explore collection not found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;
      const formattedData = {
        ...data,
        image: data.image ? `${baseUrl}/uploads/exploreImg/${data.image}` : null
      };

      return {
        status: true,
        message: 'exploreCollection detail fetched successfully !!',
        data: formattedData
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async edit(params, body, file) {
    try {
      const { id } = params
      const { categoryId, subcategoryId } = body


      const data = await knex('exploreCollection').where({ id }).first();

      if (!data) {
        return {
          status: false,
          message: 'exploreCollection not found !!'
        };
      }



      let image = data.image
      if (file && data.image) {
        const oldPath = path.join('public/uploads/exploreImg', data.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        deleteFromS3(`public/uploads/exploreImg/${data.image}`)

        const convert = await converter([file]);
        console.log("🚀 ~ blogService ~ add ~ convert:", convert)
        image = convert.length > 0 ? convert[0].filename : null;

        //   const awsUpload = await uploadToS3([file]);

        //   if (!awsUpload) {
        //     return {
        //       status: false,
        //       message: 'Blogs not added !!'
        //     }
        //   }
      }

      const updatedData = {
        image: image,
        categoryId: categoryId ? categoryId : data.categoryId,
        subcategoryId: subcategoryId ? subcategoryId : data.subcategoryId
      };

      await knex('exploreCollection').where({ id }).update(updatedData)

      return {
        status: true,
        message: 'exploreCollection updated successfully !!',
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }



}

export default new exploreService();