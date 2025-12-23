import knex from '../../common/config/database.config'
import contactResource from '../../contact-us/resources/contact.resource'
import fs from 'fs'
import path from 'path'
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";

class contactService {
  async list(query) {
    try {
      const { perPage, page, startDate, endDate } = query;
      const qb = knex('complaintQuery').select().orderBy('createdAt', 'desc');

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
      });

      if (!data || data.length === 0) {
        return {
          status: false,
          message: 'No data found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL || 'http://localhost:5001';

      const complaintData = data.data.map((item) => {
        let images = [];
        let video = [];

        try {
          const parsedImages = JSON.parse(item.images || '[]');
          images = Array.isArray(parsedImages)
            ? parsedImages.map(img => `${baseUrl}/uploads/complaint/${img}`)
            : [];
        } catch (err) {
          images = [];
        }

        try {
          const parsedVideo = JSON.parse(item.video || '[]');
          video = Array.isArray(parsedVideo) && parsedVideo.length > 0
            ? parsedVideo.map(v => `${baseUrl}/uploads/complaint/${v.trim()}`)
            : [];
        } catch (err) {
          video = [];
        }


        return {
          ...item,
          images,
          video
        };
      });

      return {
        status: true,
        message: 'Contact list fetched successfully !!',
        data: complaintData,
        pagination: data.pagination
      };
    } catch (err) {
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

      const data = await knex('complaintQuery').where({ id }).first();

      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL || 'http://localhost:5001';

      let images = [];
      let video = [];

      try {
        const parsedImages = JSON.parse(data.images || '[]');
        images = Array.isArray(parsedImages)
          ? parsedImages.map(img => `${baseUrl}/uploads/complaint/${img}`)
          : [];
      } catch (err) {
        images = [];
      }

      try {
        const parsedVideo = JSON.parse(data.video || '[]');
        video = Array.isArray(parsedVideo) && parsedVideo.length > 0
          ? parsedVideo.map(v => `${baseUrl}/uploads/complaint/${v.trim()}`)
          : [];
      } catch (err) {
        video = [];
      }

      const complaintData = {
        ...data,
        images,
        video
      };

      return {
        status: true,
        message: 'List fetched successfully !!',
        data: complaintData
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
      const { id } = params;
      const data = await knex('complaintQuery').where({ id }).first();

      if (!data) {
        return {
          status: false,
          message: 'No data found with this id !!'
        };
      }

      if (data.images) {
        let images = [];
        try {
          images = JSON.parse(data.images);
        } catch (err) {
          images = [];
        }

        if (Array.isArray(images)) {
          images.forEach(img => {
            const imagePath = path.join('public/uploads/complaint', img);
            deleteFromS3(`public/uploads/complaint/${img}`)
            // if (fs.existsSync(imagePath)) {
            //   fs.unlinkSync(imagePath);
            // }
          });
        }
      }

      if (data.video) {
        let videos = [];

        try {
          videos = JSON.parse(data.video);
        } catch {
          videos = data.video.split(',').map(v => v.trim());
        }

        if (Array.isArray(videos)) {
          videos.forEach(video => {
            const videoPath = path.join('public/uploads/complaint', video);
            deleteFromS3(`public/uploads/complaint/${video}`)
            // if (fs.existsSync(videoPath)) {
            //   fs.unlinkSync(videoPath);
            // }
          });
        }
      }

      await knex('complaintQuery').where({ id }).del();

      return {
        status: true,
        message: 'Data deleted successfully !!'
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


export default new contactService()