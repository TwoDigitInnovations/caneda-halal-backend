const mongoose = require("mongoose");
const GroceryCategory = mongoose.model("GroceryCategory");
const response = require("../responses");

module.exports = {
  createGroceryCategory: async (req, res) => {
    try {
      const name = req.body.name;

      let image = "";
      if (req.file) {
        image = req.file.location;
      }
      let cat = new GroceryCategory({ name, image });
      await cat.save();
      return response.ok(res, { message: "GroceryCategory added successfully" });
    } catch (error) {
      console.log(error)
      return response.error(res, error);
    }
  },

  getGroceryCategory: async (req, res) => {
    try {
      const { page = 1, limit } = req.query;
      let cond = {};
        if (req.query.key) {
          cond.name = { $regex: req.query.key, $options: "i" };
        }
      let grocerycategory = await GroceryCategory.find(cond)
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, grocerycategory);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getGroceryCategoryById: async (req, res) => {
    try {
      let grocerycategory = await GroceryCategory.findById(req?.params?.id);
      return response.ok(res, grocerycategory);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateGroceryCategory: async (req, res) => {
    try {
      const payload = req?.body || {};
      if (req.file) {
        payload.image = req.file.location;
      }
      let grocerycategory = await GroceryCategory.findByIdAndUpdate(
        req.params.id,
        payload,
        {
          new: true,
          upsert: true,
        }
      );
      return response.ok(res, grocerycategory);
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteGroceryCategory: async (req, res) => {
    try {
      await GroceryCategory.findByIdAndDelete(req?.params?.id);
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteAllGroceryCategory: async (req, res) => {
    try {
      const newid = req.body.grocerycategory.map(
        (f) => new mongoose.Types.ObjectId(f)
      );
      await GroceryCategory.deleteMany({ _id: { $in: newid } });
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getCategoryWithGrocerys: async (req, res) => {
    try {
      const now = new Date();
      const userId = req.user?.id;
      const userObjectId = userId && mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;
      let category = await GroceryCategory.aggregate([
        {
          $lookup: {
            from: "groceries",
            let: { categoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$grocerycategory", "$$categoryId"] },
                      { $gte: ["$expirydate", now] },
                    ],
                  },
                },
              },
              { $count: "total" },
            ],
            as: "countResult",
          },
        },
        {
          $lookup: {
            from: "groceries",
            let: { categoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$grocerycategory", "$$categoryId"] },
                      { $gte: ["$expirydate", now] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "profiles",
                  localField: "seller_profile",
                  foreignField: "_id",
                  as: "seller_profile",
                },
              },
              {
                $unwind: {
                  path: "$seller_profile",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  totalReviews: { $size: { $ifNull: ["$reviews", []] } },
                  averageRating: {
                    $cond: [
                      { $gt: [{ $size: { $ifNull: ["$reviews", []] } }, 0] },
                      {
                        $toString: {
                          $round: [
                            {
                              $divide: [
                                { $sum: "$reviews.rating" },
                                { $size: "$reviews" },
                              ],
                            },
                            1,
                          ],
                        },
                      },
                      null,
                    ],
                  },
                  isFavorite: userObjectId
                    ? { $in: [userObjectId, { $ifNull: ["$favorite", []] }] }
                    : false,
                },
              },
              {
                $project: {
                  name: 1,
                  image: 1,
                  sellerid: 1,
                  seller_profile: 1,
                  price_slot: 1,
                  sold_pieces: 1,
                  averageRating: 1,
                  totalReviews: 1,
                  isFavorite: 1,
                },
              },
              { $limit: 6 },
            ],
            as: "groceries",
          },
        },
        {
          $addFields: {
            totalCount: {
              $ifNull: [{ $arrayElemAt: ["$countResult.total", 0] }, 0],
            },
          },
        },
        { $project: { countResult: 0 } },
      ]);
      return response.ok(res, category);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getSellerCategoryWithGrocerys: async (req, res) => {
    try {
      const sellerObjectId = new mongoose.Types.ObjectId(req.query.seller_id);
      let category = await GroceryCategory.aggregate([
        {
          $lookup: {
            from: "groceries", // must match actual collection name
            let: { categoryId: "$_id", sellerId: sellerObjectId },
            pipeline: [
              {
                $match: {
                  $expr: {
                  $and: [
                    { $eq: ["$grocerycategory", "$$categoryId"] },
                    { $gte: ["$expirydate", new Date()] }, // expirydate condition
                    { $eq: ["$sellerid", "$$sellerId"] }
                  ],
                },
                },
              },
              {
            $lookup: {
              from: "profiles", // because ref: "Profile"
              localField: "seller_profile",
              foreignField: "_id",
              as: "seller_profile",
            },
          },
          {
            $unwind: {
              path: "$seller_profile",
              preserveNullAndEmptyArrays: true,
            },
          },
              {
                $project: {
                  name: 1,
                  image: 1,
                  sellerid: 1,
                  seller_profile: 1,
                  price_slot: 1,
                },
              },
              { $limit: 6 },
            ],
            as: "groceries",
          },
        },
      ]);
      return response.ok(res, category);
    } catch (error) {
      return response.error(res, error);
    }
  },
};
