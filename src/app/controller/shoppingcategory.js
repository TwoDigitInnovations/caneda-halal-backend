const mongoose = require("mongoose");
const ShoppingCategory = mongoose.model("ShoppingCategory");
const response = require("../responses");

module.exports = {
  createShoppingCategory: async (req, res) => {
    try {
      const name = req.body.name;

      let image = "";
      if (req.file) {
        image = req.file.location;
      }
      let cat = new ShoppingCategory({ name, image });
      await cat.save();
      return response.ok(res, {
        message: "ShoppingCategory added successfully",
      });
    } catch (error) {
      console.log(error);
      return response.error(res, error);
    }
  },

  getShoppingCategory: async (req, res) => {
    try {
      const { page = 1, limit } = req.query;
      let shoppingcategory = await ShoppingCategory.find()
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, shoppingcategory);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getShoppingCategoryById: async (req, res) => {
    try {
      let shoppingcategory = await ShoppingCategory.findById(req?.params?.id);
      return response.ok(res, shoppingcategory);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateShoppingCategory: async (req, res) => {
    try {
      const payload = req?.body || {};
      if (req.file) {
        payload.image = req.file.location;
      }
      let shoppingcategory = await ShoppingCategory.findByIdAndUpdate(
        req.params.id,
        payload,
        {
          new: true,
          upsert: true,
        }
      );
      return response.ok(res, shoppingcategory);
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteShoppingCategory: async (req, res) => {
    try {
      await ShoppingCategory.findByIdAndDelete(req?.params?.id);
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteAllShoppingCategory: async (req, res) => {
    try {
      const newid = req.body.shoppingcategory.map(
        (f) => new mongoose.Types.ObjectId(f)
      );
      await ShoppingCategory.deleteMany({ _id: { $in: newid } });
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  // getCategoryWithShoppings: async (req, res) => {
  //   try {
  //     let category = await ShoppingCategory.aggregate([
  //       {
  //         $lookup: {
  //           from: "groceries", // must match actual collection name
  //           let: { categoryId: "$_id" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: { $eq: ["$shoppingcategory", "$$categoryId"] },
  //               },
  //             },
  //             {
  //               $lookup: {
  //                 from: "profiles", // because ref: "Profile"
  //                 localField: "seller_profile",
  //                 foreignField: "_id",
  //                 as: "seller_profile",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$seller_profile",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },
  //             {
  //               $project: {
  //                 name: 1,
  //                 image: 1,
  //                 sellerid: 1,
  //                 seller_profile: 1,
  //                 price_slot: 1,
  //               },
  //             },
  //             { $limit: 5 },
  //           ],
  //           as: "groceries",
  //         },
  //       },
  //     ]);
  //     return response.ok(res, category);
  //   } catch (error) {
  //     return response.error(res, error);
  //   }
  // },
  getSellerCategoryWithShoppings: async (req, res) => {
    try {
       const sellerObjectId = new mongoose.Types.ObjectId(req.query.seller_id);
      let category = await ShoppingCategory.aggregate([
        {
          $lookup: {
            from: "shoppings", // must match actual collection name
            let: { categoryId: "$_id", sellerId: sellerObjectId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$shoppingcategory", "$$categoryId"] },
                      { $eq: ["$sellerid", "$$sellerId"] },
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
                  variants: 1,
                },
              },
              { $limit: 6 },
            ],
            as: "shoppings",
          },
        },
      ]);
      return response.ok(res, category);
    } catch (error) {
      return response.error(res, error);
    }
  },
};
