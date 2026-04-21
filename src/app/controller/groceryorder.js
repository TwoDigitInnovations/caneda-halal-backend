const mongoose = require("mongoose");
const Grocery = mongoose.model("Grocery");
const GroceryOrder = mongoose.model("GroceryOrder");
const Profile = mongoose.model("Profile");
const response = require("../responses");
const Transaction = mongoose.model("Transaction");
const { default: axios } = require("axios");
const { notify, schedulenotify } = require("../services/notification");

module.exports = {
  creategroceryorder: async (req, res) => {
    try {
      const payload = req?.body || {};

      const now = new Date();
      const date = now
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 17); // YYYYMMDDHHMMSSmmm

      payload.order_id = `CHMPG-${date}`;

      for (const productItem of payload.productDetail) {
        await Grocery.findByIdAndUpdate(
          productItem.grocery_id,
          { $inc: { sold_pieces: productItem.qty } }, // Increment sold_pieces
          { new: true }
        );
      }
      const newOrder = new GroceryOrder(payload);
      await newOrder.save();

      if (payload.scheduledelivery) {
           await schedulenotify(
          payload.seller_id,
          "Order Received",
          `A new order ${payload.order_id} received`,
          "GROCERY",
          payload.scheduledate
        );
      } else {
        await notify(
          payload.seller_id,
          "Order Received",
          `A new order ${payload.order_id} received`,
          "GROCERY"
        );
      }
      await notify(
        payload.user,
        "Order Placed",
        `Order ${payload.order_id} placed succesfully`,
        "GROCERY"
      );

      return response.ok(res, {
        message: "Order Place successfully",
        order: newOrder,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getgroceryorderforuser: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await GroceryOrder.find({ user: req?.user.id })
        .sort({ createdAt: -1 })
        .populate("productDetail.grocery_id")
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getpendinggroceryorderforseller: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await GroceryOrder.find({
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
        .populate("productDetail.grocery_id")
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getrunninggroceryorderforseller: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await GroceryOrder.find({
        seller_id: req?.user.id,
        $or: [
          { status: { $in: ["Preparing", "Assign"] } },
          { status: "Ready", selfpickup: true },
        ],
      })
        .sort({ createdAt: -1 })
        .populate("productDetail.grocery_id")
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getgroceryorderbyid: async (req, res) => {
    try {
      const product = await GroceryOrder.findById(req.params.id)
        .populate("user_profile driver_profile seller_profile")
        .populate("productDetail.grocery_id");
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  changegroceryorderstatus: async (req, res) => {
    try {
      const product = await GroceryOrder.findById(req.body.id).populate(
        "driver_profile seller_profile"
      );
      product.status = req.body.status;

      if (req.body.status === "Preparing") {
        await notify(
          product.user,
          "Order Accepted",
          `Your order ${product.order_id} has been accepted and is now being processed.`,
          "GROCERY"
        );
      }
      if (req.body.status === "Rejected") {
        await notify(
          product.user,
          "Order Rejected",
          `Your order ${product.order_id} has been rejected by the restaurant.`,
          "GROCERY"
        );
      }
      if (req.body.status === "Ready") {
        await notify(
          product.user,
          "Order Ready",
          `Your order ${product.order_id} has been prepared and is ready for delivery.`,
          "GROCERY"
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
          "GROCERY"
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
          req_user_type:'grocery_seller'
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
          "GROCERY"
        );
      }

      await product.save();
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  // nearbygroceryorderfordriver: async (req, res) => {
  //   try {
  //     let orders = await GroceryOrder.find({
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
  acceptedgroceryorderfordriver: async (req, res) => {
    try {
      const product = await GroceryOrder.find({
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
  rejectgroceryOrder: async (req, res) => {
    try {
      const ride = await GroceryOrder.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { rejectedbydriver: req.user.id } }, // Add only if not already present
        { new: true }
      );
      return response.ok(res, { message: "Order rejcted" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  acceptgroceryOrder: async (req, res) => {
    try {
      const ride = await GroceryOrder.findById(req.params.id);
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
  groceryorderhistoryfordriver: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const product = await GroceryOrder.find({
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
    groceryorderhistoryforseller: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 10);
      const skip = (page - 1) * limit;
      const product = await GroceryOrder.find({
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
//   groceryorderhistoryforseller: async (req, res) => {
//      try {
//       const { page = 1, limit = 20 } = req.query;

// const sellerId = req.user.id;

// const orders = await GroceryOrder.aggregate([
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
//       from: "grocerys",
//       localField: "productDetail.grocery_id",
//       foreignField: "_id",
//       as: "groceryInfo",
//     },
//   },
//   {
//     $unwind: {
//       path: "$groceryInfo",
//       preserveNullAndEmptyArrays: true,
//     },
//   },
//   {
//     $addFields: {
//       productDetail: {
//         grocery_id: "$productDetail.grocery_id",
//         grocery_name: "$productDetail.grocery_name",
//         image: "$productDetail.image",
//         qty: "$productDetail.qty",
//         price: "$productDetail.price",
//         rating: {
//           $let: {
//             vars: {
//               matchedReview: {
//                 $filter: {
//                   input: "$groceryInfo.reviews",
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
  sellermostsellinggroceryitems: async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const sellerId = req.user.id;

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      const topSellingFoods = await GroceryOrder.aggregate([
        {
          $match: {
            seller_id: new mongoose.Types.ObjectId(sellerId),
            createdAt: { $gte: startOfWeek },
          },
        },
        { $unwind: "$productDetail" },
        {
          $group: {
            _id: "$productDetail.grocery_id", // match your schema
            totalQty: { $sum: "$productDetail.qty" },
          },
        },
        {
          $lookup: {
            from: "groceries",
            localField: "_id",
            foreignField: "_id",
            as: "grocery",
          },
        },
        { $unwind: "$grocery" },
        {
          $project: {
            grocery_id: "$grocery._id",
            name: "$grocery.name",
            price_slot: "$grocery.price_slot",
            image: { $arrayElemAt: ["$grocery.image", 0] }, // pick first image
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
  deliverybygroceryseller: async (req, res) => {
    try {
      const product = await GroceryOrder.findById(req.body.id).populate(
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
        req_user_type:'grocery_seller'
      });
      await sellertxn.save();
      await notify(
        product.user,
        "Order Delivered",
        `You order ${product?.order_id} has been delivered successfully.`,
        "GROCERY"
      );

      await product.save();
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getAllGroceryOrdersAdmin: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 10);
      const skip = (page - 1) * limit;
      const data = await GroceryOrder.find({})
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
