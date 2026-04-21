const mongoose = require("mongoose");
const Transaction = mongoose.model("Transaction");
const response = require("../responses");
const Profile = mongoose.model("Profile");

module.exports = {
  createTransaction: async (req, res) => {
    try {
      req.body.req_user = req.user.id;
      const txn = new Transaction(req.body);
      const sav = await txn.save();
      let pro = await Profile.findById(req.body.req_profile)
      pro.wallet=pro.wallet-req.body.amount
      await pro.save()
      return response.ok(res, sav);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getTransaction: async (req, res) => {
    try {
      // Pagination
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit;

      const reqlist = await Transaction.find({req_user:req.user.id,req_profile:req.params.id})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        return response.ok(res, reqlist);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getPendingTransaction: async (req, res) => {
    try {
      // Pagination
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit;
const cond = {req_user_type:req.query.reqtype,type:'WITHDRAWAL',status:'Pending'};
      if (req.query.req_user_type) {
        cond.req_user_type = req.query.req_user_type;
      }
      const reqlist = await Transaction.find(cond)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("req_profile");
      const total = await Transaction.countDocuments(cond);
      const totalPages = Math.ceil(total / limit);
      return res.status(200).json({
        status: true,
        data: reqlist,
        pagination: {
          totalItems: total,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getAllTransaction: async (req, res) => {
    try {
      const reqlist = await Transaction.find().sort({
        createdAt: -1,
      });
      return response.ok(res, reqlist);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateTransaction: async (req, res) => {
    try {
       await Transaction.findByIdAndUpdate(req?.params?.id, {
        $set: { status: "Approved" },
      });


      return response.ok(res, { message: "Status update succesfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getSellerRevenue : async (req, res) => {
  try {
  const { type ,usertype} = req.query;
  const sellerId = req.user.id;

  let match = {
    req_user: new mongoose.Types.ObjectId(sellerId),
    type: 'EARN',
    status: 'Approved',
    req_user_type:usertype
  };

  const now = new Date();
  let startDate, groupStage;

  switch (type) {
   case 'day': {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    match.createdAt = { $gte: startDate };

    groupStage = {
      _id: {
        $toString: {
          $cond: [
            { $lt: [{ $hour: "$createdAt" }, 10] },
            { $concat: ["0", { $toString: { $hour: "$createdAt" } }, ":00"] },
            { $concat: [{ $toString: { $hour: "$createdAt" } }, ":00"] }
          ]
        }
      },
      total: { $sum: "$amount" },
      count: { $sum: 1 }
    };
    break;
    }

    case 'week': {
      const dayOfWeek = now.getDay(); // 0 = Sun
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);

      match.createdAt = { $gte: startDate };

      groupStage = {
        _id: {
          $let: {
            vars: {
              days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
              dayIndex: { $dayOfWeek: "$createdAt" } // 1 = Sun, 7 = Sat
            },
            in: {
              $arrayElemAt: ["$$days", { $subtract: ["$$dayIndex", 1] }]
            }
          }
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      };
      break;
    }

    case 'month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      match.createdAt = { $gte: startDate };

      groupStage = {
        _id: {
          $toString: {
            $cond: [
              { $lt: [{ $dayOfMonth: "$createdAt" }, 10] },
              { $concat: ["0", { $toString: { $dayOfMonth: "$createdAt" } }] },
              { $toString: { $dayOfMonth: "$createdAt" } }
            ]
          }
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      };
      break;
    }

    case 'year': {
      startDate = new Date(now.getFullYear(), 0, 1);
      match.createdAt = { $gte: startDate };

      groupStage = {
        _id: {
          $let: {
            vars: {
              months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              monthIndex: { $subtract: [{ $month: "$createdAt" }, 1] }
            },
            in: {
              $arrayElemAt: ["$$months", "$$monthIndex"]
            }
          }
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      };
      break;
    }

    default:
      return response.badReq(res, { message: 'Invalid type (day, week, month, year allowed)' });
  }

  const revenueData = await Transaction.aggregate([
    { $match: match },
    {
      $group: groupStage
    },
    { $sort: { _id: 1 } }
  ]);

  return res.json({
    type,
    data: revenueData,
  });

} catch (error) {
  console.error("Revenue fetch error:", error);
  return res.status(500).json({ message: "Internal server error" });
}
  }
};
