import knex from "../common/config/database.config";

class sliderService {
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
}

export default new sliderService()