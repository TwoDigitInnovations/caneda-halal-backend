const mongoose = require("mongoose");
const FoodCategory = mongoose.model("FoodCategory");
const response = require("../responses");

module.exports = {
  createFoodCategory: async (req, res) => {
    try {
      const name = req.body.name;

      let image = "";
      if (req.file) {
        image = req.file.location;
      }
      let cat = new FoodCategory({ name, image });
      await cat.save();
      return response.ok(res, { message: "FoodCategory added successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getFoodCategory: async (req, res) => {
    try {
      const { page = 1, limit } = req.query;
      let foodcategory = await FoodCategory.find()
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, foodcategory);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getFoodCategoryById: async (req, res) => {
    try {
      let foodcategory = await FoodCategory.findById(req?.params?.id);
      return response.ok(res, foodcategory);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateFoodCategory: async (req, res) => {
    try {
      const payload = req?.body || {};
      if (req.file) {
        payload.image = req.file.location;
      }
      let foodcategory = await FoodCategory.findByIdAndUpdate(
        req.params.id,
        payload,
        {
          new: true,
          upsert: true,
        }
      );
      return response.ok(res, foodcategory);
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteFoodCategory: async (req, res) => {
    try {
      await FoodCategory.findByIdAndDelete(req?.params?.id);
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteAllFoodCategory: async (req, res) => {
    try {
      const newid = req.body.foodcategory.map(
        (f) => new mongoose.Types.ObjectId(f)
      );
      await FoodCategory.deleteMany({ _id: { $in: newid } });
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getCategoryWithFoods: async (req, res) => {
    try {
      let category = await FoodCategory.aggregate([
        {
          $lookup: {
            from: "foods", // must match actual collection name
            let: { categoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$foodcategory", "$$categoryId"] },
                },
              },
              {
                $project: {
                  name: 1,
                  image: 1,
                  price: 1,
                },
              },
              { $limit: 5 },
            ],
            as: "foods",
          },
        },
      ]);
      return response.ok(res, category);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getSellerCategoryWithFoods: async (req, res) => {
    try {
      const sellerObjectId = new mongoose.Types.ObjectId(req.query.seller_id);

      let category = await FoodCategory.aggregate([
        {
          $lookup: {
            from: "foods",
            let: { categoryId: "$_id", sellerId: sellerObjectId },
            pipeline: [
              {
                $match: {
                  $expr: 
                  {$and: [
                  { $eq: ["$foodcategory", "$$categoryId"] },
                  { $eq: ["$sellerid", "$$sellerId"] }
                ] },
                },
              },
              {
                $project: {
                  name: 1,
                  image: 1,
                  price: 1,
                },
              },
              { $limit: 6 },
            ],
            as: "foods",
          },
        },
      ]);
      return response.ok(res, category);
    } catch (error) {
      return response.error(res, error);
    }
  },
};
