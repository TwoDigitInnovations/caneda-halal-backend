const mongoose = require("mongoose");
const Shopping = mongoose.model("Shopping");
const ShoppingOrder = mongoose.model("ShoppingOrder");
const Profile = mongoose.model("Profile");
const response = require("../responses");
const Transaction = mongoose.model("Transaction");
const { default: axios } = require("axios");
const { notify, schedulenotify } = require("../services/notification");

module.exports = {
  createshoppingorder: async (req, res) => {
    try {
      const payload = req?.body || {};

      const now = new Date();
      const date = now
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 17); // YYYYMMDDHHMMSSmmm

      payload.order_id = `CHMPS-${date}`;

      for (const productItem of payload.productDetail) {
        await Shopping.findByIdAndUpdate(
          productItem.shopping_id,
          { $inc: { sold_pieces: productItem.qty } }, // Increment sold_pieces
          { new: true }
        );
      }
      const newOrder = new ShoppingOrder(payload);
      await newOrder.save();

      if (payload.scheduledelivery) {
           await schedulenotify(
          payload.seller_id,
          "Order Received",
          `A new order ${payload.order_id} received`,
          "SHOPPING",
          payload.scheduledate
        );
      } else {
        await notify(
          payload.seller_id,
          "Order Received",
          `A new order ${payload.order_id} received`,
          "SHOPPING"
        );
      }
      await notify(
        payload.user,
        "Order Placed",
        `Order ${payload.order_id} placed succesfully`,
        "SHOPPING"
      );

      return response.ok(res, {
        message: "Order Place successfully",
        order: newOrder,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getshoppingorderforuser: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await ShoppingOrder.find({ user: req?.user.id })
        .sort({ createdAt: -1 })
        .populate("productDetail.shopping_id")
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getpendingshoppingorderforseller: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await ShoppingOrder.find({
        seller_id: req?.user.id,
        status: "Pending",
        $or: [
          { scheduledelivery: { $ne: true } },
          {
            scheduledelivery: true,
            scheduledate: { $lte: new Date() }, // Show only if scheduled and the date/time has passed
          },
        ],
      })
        .sort({ createdAt: -1 })
        .populate("productDetail.shopping_id")
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getrunningshoppingorderforseller: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await ShoppingOrder.find({
        seller_id: req?.user.id,
        $or: [
          { status: { $in: ["Preparing", "Assign"] } },
          { status: "Ready", selfpickup: true },
        ],
      })
        .sort({ createdAt: -1 })
        .populate("productDetail.shopping_id")
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getshoppingorderbyid: async (req, res) => {
    try {
      const product = await ShoppingOrder.findById(req.params.id)
        .populate("user_profile driver_profile seller_profile")
        .populate("productDetail.shopping_id");
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  changeshoppingorderstatus: async (req, res) => {
    try {
      const product = await ShoppingOrder.findById(req.body.id).populate(
        "driver_profile seller_profile"
      );
      product.status = req.body.status;

      if (req.body.status === "Preparing") {
        await notify(
          product.user,
          "Order Accepted",
          `Your order ${product.order_id} has been accepted and is now being processed.`,
          "SHOPPING"
        );
      }
      if (req.body.status === "Rejected") {
        await notify(
          product.user,
          "Order Rejected",
          `Your order ${product.order_id} has been rejected by the restaurant.`,
          "SHOPPING"
        );
      }
      if (req.body.status === "Ready") {
        await notify(
          product.user,
          "Order Ready",
          `Your order ${product.order_id} has been prepared and is ready for delivery.`,
          "SHOPPING"
        );
        if (product?.driver_id) {
          await notify(
            product.driver_id,
            "Order Ready",
            `Your order ${product.order_id} is ready. Please collect it from the counter.`,
            "DELIVERYRIDER"
          );
        }
      }
      if (req.body.status === "Assign") {
        let driverlist = await Profile.find({
          role: "DELIVERYRIDER",
          location: {
            $near: {
              $maxDistance: 1609.34 * 10,
              $geometry: product.location,
            },
          },
        });
        if (driverlist.length > 0) {
          const user = [];
          driverlist.map((item) => user.push(item.user));
          await notify(
            user,
            "Order Received",
            `New order ${product.order_id} received for delivery`,
            "DELIVERYRIDER"
          );
        }
      }
      if (req.body.status === "Collected") {
        await notify(
          product.user,
          "Order Collected by Driver",
          `Driver ${product.driver_profile.username} has collected order ${product.order_id} from ${product.seller_profile.store_name}`,
          "SHOPPING"
        );
      }
      if (req.body.status === "Delivered") {
        const seller = await Profile.findById(product.seller_profile._id);
        const driver = await Profile.findById(product.driver_profile._id);
        seller.wallet = seller.wallet+product.total;
        driver.wallet = driver.wallet+product.total_deliverd_amount;
        await seller.save();
        await driver.save();
        product.deliveredAt = new Date();
        const sellertxn = new Transaction({
          req_user: product.seller_id,
          req_profile: product.seller_profile._id,
          amount: product.total,
          type: "EARN",
          status: "Approved",
          req_user_type:'shopping_seller'
        });
        await sellertxn.save();
        const drivertxn = new Transaction({
          req_user: product.driver_id,
          req_profile: product.driver_profile._id,
          amount: product.total_deliverd_amount,
          type: "EARN",
          status: "Approved",
          req_user_type:'delivery_rider'
        });
        await drivertxn.save();
        await notify(
          product.user,
          "Order Delivered",
          `You order ${product?.order_id} has been delivered successfully.`,
          "SHOPPING"
        );
      }

      await product.save();
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  // nearbyshoppingorderfordriver: async (req, res) => {
  //   try {
  //     let orders = await ShoppingOrder.find({
  //       $and: [
  //         {
  //           $or: [
  //             { status: "Assign" },
  //             { status: "Ready", selfpickup: { $exists: false } }, // Ready orders only if selfpickup not true
  //           ],
  //         },
  //         {
  //           driver_id: { $exists: false },
  //         },
  //         {
  //           location: {
  //             $near: {
  //               $maxDistance: 1609.34 * 10, // 10 miles
  //               $geometry: {
  //                 type: "Point",
  //                 coordinates: req.body.location,
  //               },
  //             },
  //           },
  //         },
  //         {
  //           rejectedbydriver: { $nin: [req.user.id] },
  //         },
  //       ],
  //     })
  //       .sort({ createdAt: -1 })
  //       .populate("user_profile seller_profile");
  //     return response.ok(res, orders);
  //   } catch (err) {
  //     return response.error(res, err);
  //   }
  // },
  acceptedshoppingorderfordriver: async (req, res) => {
    try {
      const product = await ShoppingOrder.find({
        driver_id: req.user.id,
        status: { $ne: "Delivered" },
      })
        .sort({ createdAt: -1 })
        .populate("user_profile seller_profile");
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  rejectshoppingOrder: async (req, res) => {
    try {
      const ride = await ShoppingOrder.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { rejectedbydriver: req.user.id } }, // Add only if not already present
        { new: true }
      );
      return response.ok(res, { message: "Order rejcted" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  acceptshoppingOrder: async (req, res) => {
    try {
      const ride = await ShoppingOrder.findById(req.params.id);
      if (ride.driver_id) {
        return response.badReq(res, { message: "Order already accepted" });
      }
      const u = await Profile.findOne({
        user: req.user.id,
        role: "DELIVERYRIDER",
      });
      ride.driver_id = req.user.id;
      ride.driver_profile = u._id;
      ride.save();
      return response.ok(res, { message: "Ride accept" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  shoppingorderhistoryfordriver: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const product = await ShoppingOrder.find({
        driver_id: req.user.id,
        status: "Delivered",
      })
        .sort({ createdAt: -1 })
        .populate("user_profile seller_profile")
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
    shoppingorderhistoryforseller: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 10);
      const skip = (page - 1) * limit;
      const product = await ShoppingOrder.find({
        seller_id: req?.user.id,
        $or: [
          { status: { $in: ["Delivered", "Collected"] } },
          {
              $and: [
                { status: "Ready" },
                { selfpickup: { $exists: false } }
              ]
            },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip(skip);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
//   shoppingorderhistoryforseller: async (req, res) => {
//      try {
//       const { page = 1, limit = 20 } = req.query;

// const sellerId = req.user.id;

// const orders = await ShoppingOrder.aggregate([
//   {
//     $match: {
//       seller_id: new mongoose.Types.ObjectId(sellerId),
//       status: "Delivered",
//     },
//   },
//   {
//     $sort: { createdAt: -1 },
//   },
//   {
//     $skip: (page - 1) * limit,
//   },
//   {
//     $limit: parseInt(limit),
//   },
//   {
//     $unwind: "$productDetail",
//   },
//   {
//     $lookup: {
//       from: "shoppings",
//       localField: "productDetail.shopping_id",
//       foreignField: "_id",
//       as: "shoppingInfo",
//     },
//   },
//   {
//     $unwind: {
//       path: "$shoppingInfo",
//       preserveNullAndEmptyArrays: true,
//     },
//   },
//   {
//     $addFields: {
//       productDetail: {
//         shopping_id: "$productDetail.shopping_id",
//         shopping_name: "$productDetail.shopping_name",
//         image: "$productDetail.image",
//         qty: "$productDetail.qty",
//         price: "$productDetail.price",
//         rating: {
//           $let: {
//             vars: {
//               matchedReview: {
//                 $filter: {
//                   input: "$shoppingInfo.reviews",
//                   as: "review",
//                   cond: {
//                     $eq: ["$$review.userId", "$user"],
//                   },
//                 },
//               },
//             },
//             in: {
//               $ifNull: [{ $arrayElemAt: ["$$matchedReview.rating", 0] }, null],
//             },
//           },
//         },
//       },
//     },
//   },
//   {
//     $group: {
//       _id: "$_id",
//       order_id: { $first: "$order_id" },
//       user: { $first: "$user" },
//       seller_id: { $first: "$seller_id" },
//       total: { $first: "$total" },
//       status: { $first: "$status" },
//       createdAt: { $first: "$createdAt" },
//       productDetail: { $push: "$productDetail" },
//     },
//   },
//   {
//   $sort: { createdAt: -1 }
// }
// ]);

//       return response.ok(res, orders);
//     } catch (error) {
//       return response.error(res, error);
//     }
//   },
  sellermostsellingshoppingitems: async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const sellerId = req.user.id;

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      const topSellingFoods = await ShoppingOrder.aggregate([
        {
          $match: {
            seller_id: new mongoose.Types.ObjectId(sellerId),
            createdAt: { $gte: startOfWeek },
          },
        },
        { $unwind: "$productDetail" },
        {
          $group: {
            _id: "$productDetail.shopping_id", // match your schema
            totalQty: { $sum: "$productDetail.qty" },
          },
        },
        {
          $lookup: {
            from: "shoppings",
            localField: "_id",
            foreignField: "_id",
            as: "shopping",
          },
        },
        { $unwind: "$shopping" },
        {
          $project: {
            shopping_id: "$shopping._id",
            name: "$shopping.name",
            variants: "$shopping.variants",
            // image: { $arrayElemAt: ["$shopping.image", 0] }, 
            totalQty: 1,
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: Number(limit) },
      ]);

      return response.ok(res, topSellingFoods);
    } catch (error) {
      return response.error(res, error);
    }
  },
  deliverybyshoppingseller: async (req, res) => {
    try {
      const product = await ShoppingOrder.findById(req.body.id).populate(
        "seller_profile"
      );
      if (product.pickupOTP !== req.body.otp) {
        return response.badReq(res, { message: "OTP does not match" });
      }
      product.status = "Delivered";

      const seller = await Profile.findById(product.seller_profile._id);
      seller.wallet = product.total;
      await seller.save();
      product.deliveredAt = new Date();
      const sellertxn = new Transaction({
        req_user: product.seller_id,
        req_profile: product.seller_profile._id,
        amount: product.total,
        type: "EARN",
        status: "Approved",
        req_user_type:'shopping_seller'
      });
      await sellertxn.save();
      await notify(
        product.user,
        "Order Delivered",
        `You order ${product?.order_id} has been delivered successfully.`,
        "SHOPPING"
      );

      await product.save();
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getAllShoppingOrdersAdmin: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 10);
      const skip = (page - 1) * limit;
      const data = await ShoppingOrder.find({})
        .sort({ createdAt: -1 })
        .populate("user_profile driver_profile seller_profile")
        .limit(limit * 1)
        .skip(skip);
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
};
