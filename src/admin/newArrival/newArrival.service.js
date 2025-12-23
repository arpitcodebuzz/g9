import knex from "../../common/config/database.config";
import path from 'path'
import fs from 'fs'
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";
import { converter } from "../../common/config/productImage.config";


class newArrivalService {
  async add(body, file) {
    try {
      const { stockNumber, productId } = body;
      const banner = file ? file.filename : null;

      if (!banner) {
        return {
          status: false,
          message: 'Banner image is required !!'
        };
      }
      const convert = await converter([file]);
      console.log("🚀 ~ blogService ~ add ~ convert:", convert)
      const image = convert.length > 0 ? convert[0].filename : null;

      // const awsUpload = await uploadToS3([file]);
      // console.log("🚀 ~ newArrivalService ~ add ~ awsUpload:", awsUpload)

      // if (!awsUpload) {
      //   return {
      //     status: false,
      //     message: 'NewArrival not added !!'
      //   }
      // }

      if (!productId) {
        return {
          status: false,
          message: 'Product ID is required !!'
        };
      }

      await knex('newArrival').insert({
        banner: image,
        stockNumber,
        productId,
      });

      return {
        status: true,
        message: 'New Arrival added successfully',
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async list() {
    try {
      const data = await knex('newArrival').select().orderBy('createdAt', 'desc');
      // console.log(data)
      if (!data || data.length === 0) {
        return {
          status: true,
          message: 'newArrival not found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const formattedData = data.map(item => ({
        ...item,
        banner: item.banner ? `${baseUrl}/uploads/newArrival/${item.banner}` : null
      }));

      return {
        status: true,
        message: 'newArrival fetched successfully !!',
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

      const data = await knex('newArrival').where({ id }).first()

      if (!data) {
        return {
          status: true,
          message: 'newArrival not found !!'
        }
      }

      if (data.banner) {
        const imagepath = path.join('public/uploads/newArrival', data.banner)
        // if (fs.existsSync(imagepath)) fs.unlinkSync(imagepath)
        deleteFromS3(`public/uploads/newArrival/${data.banner}`)
      }

      await knex('newArrival').where({ id }).del()

      return {
        status: true,
        message: 'newArrival deleted successfully !!'
      }

    } catch (err) {
      console.log(err)
      return { status: false, message: 'Something went wrong !!' }
    }
  }

  async detail(params) {
    try {
      const { id } = params

      const data = await knex('newArrival').where({ id }).first();

      if (!data) {
        return {
          status: false,
          message: 'newArrival not found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;
      const formattedData = {
        ...data,
        banner: data.banner ? `${baseUrl}/uploads/newArrival/${data.banner}` : null
      };

      return {
        status: true,
        message: 'newArrival detail fetched successfully !!',
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
      const { stockNumber, productId } = body

      const data = await knex('newArrival').where({ id }).first();
      // console.log(data, 'data')

      if (!data) {
        return {
          status: false,
          message: 'newArrival not found !!'
        };
      }



      let image = data.banner
      if (file && data.banner) {
        const oldPath = path.join('public/uploads/newArrival', data.banner);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        deleteFromS3(`public/uploads/newArrival/${data.banner}`)

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
        banner: image,
        stockNumber: stockNumber ? stockNumber : data.stockNumber,
        productId: productId ? productId : data.productId
      };

      await knex('newArrival').where({ id }).update(updatedData)

      return {
        status: true,
        message: 'newArrival updated successfully !!',
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

export default new newArrivalService()