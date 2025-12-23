import knex from "../../common/config/database.config";
import mediaresource from './resources/media.resource'
import fs from 'fs'
import path from 'path'
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";
import { converter } from "../../common/config/productImage.config";


class mediaService {
  async add(body, file) {
    try {
      const { title, description, redirectUrl } = body
      // const image = file ? file.filename : null;

      if (redirectUrl && !/^https?:\/\/|^www\./i.test(redirectUrl)) {
        return {
          status: false,
          message: 'Invalid URL. Must start with "http://", "https://" or "www."'
        };
      }

      let image = null;
      if (file) {
        const convert = await converter([file]);
        console.log("🚀 ~ blogService ~ add ~ convert:", convert)
        image = convert.length > 0 ? convert[0].filename : null;
        // const awsUpload = await uploadToS3([file]);

        // if (!awsUpload) {
        //   return {
        //     status: false,
        //     message: 'Media not added !!'
        //   }
        // }
      }


      function startsWithCapital(str) {
        return /^[A-Z]/.test(str);
      }

      if (!startsWithCapital(title)) {
        return {
          status: false,
          message: 'Title must start with a capital letter !'
        }
      }

      await knex('media').insert({
        title,
        description,
        redirectUrl,
        image
      })

      return {
        status: true,
        message: 'media data added successfully !!'
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
      const data = await knex('media').select().orderBy('createdAt', 'desc')
      const mediaData = data.map((data) => new mediaresource(data))
      return {
        status: true,
        message: 'media list fetched successfully !!',
        data: mediaData
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

  async detail(params) {
    try {
      const { id } = params
      const data = await knex('media').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }
      const mediadata = new mediaresource(data);

      return {
        status: true,
        message: 'media list fetched successfully !!',
        data: mediadata
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

  async delete(params) {
    try {
      const { id } = params
      const data = await knex('media').where({ id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !'
        }
      }

      if (data.image) {
        const imagepath = path.join('public/uploads/media', data.image)
        deleteFromS3(`public/uploads/media/${data.image}`)
        // if (fs.existsSync(imagepath)) {
        //   fs.unlinkSync(imagepath)
        // }
      }

      await knex('media').where({ id }).del()
      return {
        status: true,
        message: 'media data deleted successfully !!'
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

  async edit(params, body, file) {
    try {
      const { id } = params;
      const { title, description, redirectUrl } = body

      const data = await knex('media').where({ id }).first();
      if (!data) {
        return {
          status: true,
          message: 'No data found !!'
        };
      }

      let image = data.image
      if (file && data.image) {
        const oldImagePath = path.join(
          __dirname,
          '../../../public/uploads/media',
          data.image
        );
        deleteFromS3(`public/uploads/media/${data.image}`)
        const convert = await converter([file]);
        console.log("🚀 ~ blogService ~ add ~ convert:", convert)
        image = convert.length > 0 ? convert[0].filename : null;
        // if (fs.existsSync(oldImagePath)) {
        //   fs.unlinkSync(oldImagePath);
        // }
        // const awsUpload = await uploadToS3([file]);

        // if (!awsUpload) {
        //   return {
        //     status: false,
        //     message: 'Media not added !!'
        //   }
        // }
      }

      const updatedData = {
        title: title && title.trim() !== "" ? title : data.title,
        description: description && description.trim() !== "" ? description : data.description,
        redirectUrl: redirectUrl && redirectUrl.trim() !== "" ? redirectUrl : data.redirectUrl,
        image: file ? file.filename : data.image,
      };

      await knex('media').where({ id }).update(updatedData);

      return {
        status: true,
        message: 'media data updated successfully !!',
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

export default new mediaService()