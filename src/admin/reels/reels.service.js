import knex from '../../common/config/database.config'
import path from 'path'
import fs from 'fs'
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";

class reelService {
  async add(file) {
    try {
      const reels = file ? file.filename : null
      if (!reels) {
        return {
          status: false,
          message: 'Video is required !!'
        }
      }
      const allowedMimeTypes = [
        'video/mp4',
        'video/mkv',
        'video/avi',
        'video/mov',
        'video/webm'
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        return {
          status: false,
          message: 'Only video files are allowed !!'
        };
      }

      const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSizeInBytes) {
        return {
          status: false,
          message: 'Video must be less than 10 MB !!'
        };
      }

      const awsUpload = await uploadToS3([file]);
      // console.log("🚀 ~ reelService ~ add ~ awsUpload:", awsUpload)

      if (!awsUpload) {
        return {
          status: false,
          message: 'reels not added !!'
        }
      }


      await knex('reels').insert({
        video: reels
      })

      return {
        status: true,
        message: 'Reels added successfully !!'
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
      const data = await knex('reels').select().orderBy('createdAt', 'desc');

      if (!data || data.length === 0) {
        return {
          status: true,
          message: 'Reels not found !!',
          data: []
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const formattedData = data.map(item => ({
        id: item.id,
        video: item.video ? `${baseUrl}/uploads/reels/${item.video}` : null,
        createdAt: item.createdAt
      }));

      return {
        status: true,
        message: 'Reels fetched successfully !!',
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
      const { id } = params;

      const data = await knex('reels').where({ id }).first();
      if (!data) {
        return {
          status: false,
          message: 'Reel not found !!'
        };
      }

      if (data.video) {
        const videopath = path.join('public/uploads/reels', data.video)
        // if (fs.existsSync(videopath)) fs.unlinkSync(videopath)
        deleteFromS3(`public/uploads/reels/${data.image}`)
      }


      await knex('reels').where({ id }).del();

      return {
        status: true,
        message: 'Reel deleted successfully !!'
      };


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

export default new reelService()