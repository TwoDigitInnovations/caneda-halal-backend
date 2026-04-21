"use strict";
const userHelper = require("./../helper/user");
const response = require("./../responses");
const passport = require("passport");
const jwtService = require("./../services/jwtService");
const mailNotification = require("./../services/mailNotification");
const mongoose = require("mongoose");
const { notify } = require("../services/notification");
const sendOtp = require("../services/sendOtp");
const Tax = require("../model/tax");
const User = mongoose.model("User");
const Profile = mongoose.model("Profile");
const Verification = mongoose.model("Verification");
const Device = mongoose.model("Device");

module.exports = {
  sendOTP: async (req, res) => {
    try {
      const payload = req.body;
      const veruser = await Verification.findOne({ phone: payload.phone });

      console.log("veruser", veruser);

      if (veruser) {
        veruser.expiration_at = userHelper.getDatewithAddedMinutes(5);
        await veruser.save();
      } else {
        let ran_otp = "0000";
        let ver = new Verification({
          otp: ran_otp,
          phone: payload.phone,
          expiration_at: userHelper.getDatewithAddedMinutes(5),
        });
        await ver.save();
      }
      // console.log('payload==>',payload)
      // console.log('==>',`+${payload?.countrycode}${payload?.phone}`)
      //  await sendOtp.sendOtp(`+${payload?.countrycode}`,payload?.phone)

      let user = await User.findOne({
        phone: payload.phone,
      });
      // }
      //   let token = await userHelper.encode(ver._id);
      //  const ress= await sendnewOtp(payload.phone,res)
      //  if(!ress.success){
      //   return response.badReq(res, { message: ress.message });
      //  }
      return response.ok(res, {
        message: "OTP sent.",
        newuser: user?.username ? false : true,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  verifyOTP: async (req, res) => {
    try {
      const payload = req.body;
      // console.log(payload);
      let ver = await Verification.findOne({ phone: payload.phone });
      console.log("ver", ver);
      if (ver) {
        if (
          payload.otp === ver.otp &&
          !ver.verified &&
          new Date().getTime() < new Date(ver.expiration_at).getTime()
        ) {
          let user = await User.find({
            phone: payload.phone,
          });
          console.log("user", user);
          if (!user.length) {
            let user = new User({
              phone: payload?.phone,
              username: payload?.name,
              type: "USER",
              countryCode: payload?.countryCode || "+1",
              tax_number: payload?.tax_number,
              email: payload?.email,
            });
            let profile = new Profile({
              phone: payload?.phone,
              username: payload?.name,
              role: "RIDEUSER",
              user: user._id,
            });

            await user.save();
            await profile.save();
            await Verification.findOneAndDelete({ phone: payload.phone });

            let token = await new jwtService().createJwtToken({
              id: user._id,
              type: user.type,
              // tokenVersion: user.tokenVersion
            });
            await Device.updateOne(
              { device_token: req.body.device_token },
              { $set: { player_id: req.body.player_id, user: user._id } },
              { upsert: true }
            );
            const data = {
              token,
              ...user._doc,
            };
            delete data.password;
            res.status(200).json({ success: true, data: data });
          } else {
            let token = await new jwtService().createJwtToken({
              id: user[0]._id,
              type: user[0].type,
            });
            const data = {
              token,
              ...user[0]._doc,
            };
            await Device.updateOne(
              { device_token: req.body.device_token },
              { $set: { player_id: req.body.player_id, user: user[0]._id } },
              { upsert: true }
            );
            res.status(200).json({ success: true, data: data });
          }
        } else {
          res.status(404).json({ success: false, message: "Invalid OTP" });
        }
      } else {
        res.status(404).json({ success: false, message: "Invalid OTP" });
      }
    } catch (err) {
      console.log(err);
      return response.error(res, err);
    }
  },

  getProfile: async (req, res) => {
    try {
      const u = await Profile.findOne({
        user: req.user.id,
        role: req.params.role,
      });
      return response.ok(res, u);
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateProfile: async (req, res) => {
    const payload = req.body;
    const userId = req?.body?.userId || req.user.id;
    try {
      const u = await Profile.findOne({
        user: req.user.id,
        role: req.params.role,
      });
      if (u) {
        if (
          (req.params.role === "RIDEDRIVER" ||
          req.params.role === "DELIVERYRIDER")&&u.status==='Pending'
        ) {
          delete payload.role
          const updateuser1 = await Profile.findOneAndUpdate(
            { user: userId, role: "RIDEDRIVER" },
            { $set: payload },
            {
              new: true,
              upsert: true,
            }
          );
          const updateuser2 = await Profile.findOneAndUpdate(
            { user: userId, role: "DELIVERYRIDER" },
            { $set: payload },
            {
              new: true,
              upsert: true,
            }
          );
          return response.ok(
            res,
            req.params.role === "RIDEDRIVER" ? updateuser1 : updateuser2
          );
        }
        const updateuser = await Profile.findByIdAndUpdate(
          u._id,
          { $set: payload },
          {
            new: true,
            upsert: true,
          }
        );
        return response.ok(res, updateuser);
      } else {
        let user = await User.findById(userId);
        (payload.role = req.params.role), (payload.user = userId);
        (payload.phone = user?.phone), (payload.username = user?.username);
        let profile = new Profile(payload);
        profile.save();
        if (
          req.params.role === "RIDEDRIVER" ||
          req.params.role === "DELIVERYRIDER"
        ) {
          payload.role =
            req.params.role === "RIDEDRIVER" ? "DELIVERYRIDER" : "RIDEDRIVER";
          let profile2 = new Profile(payload);
          profile2.save();
        }
        return response.ok(res, profile);
      }
    } catch (error) {
      return response.error(res, error);
    }
  },
  getCombinedProfile: async (req, res) => {
  try {
    const profiles = await Profile.find({ user: req.user.id });

    const responseData = {};
    profiles.forEach(profile => {
      responseData[profile.role] = profile; // e.g., responseData['FOODSELLER'] = {...}
    });

    return response.ok(res, responseData);
  } catch (error) {
    return response.error(res, error);
  }
},
  getProfileStatus: async (req, res) => {
  try {
  const profiles = await Profile.find({ user: req.user.id }).lean();

  const responseData = {};

  profiles.forEach(profile => {
    responseData[profile.role] = profile.status === "VERIFIED";
  });

  return response.ok(res, responseData);
} catch (error) {
  return response.error(res, error.message || "Something went wrong");
}
},

  getAllDriver: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 0;
      const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;

      const user = await Profile.find({ role: "RIDEDRIVER" })
      .sort({ createdAt: -1 })
        .skip(page * rowsPerPage)
        .limit(rowsPerPage);

      const total = await Profile.countDocuments({ role: "RIDEDRIVER" });
      const totalPages = Math.ceil(total / rowsPerPage);
      return res.status(200).json({
        status: true,
        data: user,
        pagination: {
          totalItems: total,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: rowsPerPage,
        },
      });
      // return response.ok(res, responseData);
    } catch (error) {
      return response.error(res, error);
    }
  },
  verifydriver: async (req, res) => {
    try {
      const user = await Profile.findById(req.params.id);
      user.status = req?.body?.verified;
      await user.save();
      const user2 = await Profile.findOne({
        user: user.user,
        role: user.role === "RIDEDRIVER" ? "DELIVERYRIDER" : "RIDEDRIVER",
      });
      user2.status = req?.body?.verified;
      await user2.save();
      if (req.body.verified === "VERIFIED") {
        await notify(
          user.user,
          "Account Verified",
          "Your chmp delivery account is now verified",
          "RIDE"
        );
        await notify(
          user.user,
          "Account Verified",
          "Your chmp driver account is now verified",
          "DELIVERYRIDER"
        );
      }
      if (req.body.verified === "SUSPEND") {
        await notify(
          user.user,
          "Account Suspended",
          "Your chmp delivery account is suspended",
          "RIDE"
        );
        await notify(
          user.user,
          "Account Suspended",
          "Your chmp driver account is suspended",
          "DELIVERYRIDER"
        );
      }
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getAllfoodseller: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 0;
      const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;

      const user = await Profile.find({ role: "FOODSELLER" })
      .sort({ createdAt: -1 })
        .skip(page * rowsPerPage)
        .limit(rowsPerPage);

      const total = await Profile.countDocuments({ role: "FOODSELLER" });
      const totalPages = Math.ceil(total / rowsPerPage);
      return res.status(200).json({
        status: true,
        data: user,
        pagination: {
          totalItems: total,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: rowsPerPage,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },




   grocryseller: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 0;
      const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;

      const user = await Profile.find({ role: "GROCERYSELLER" })
      .sort({ createdAt: -1 })
        .skip(page * rowsPerPage)
        .limit(rowsPerPage);

      const total = await Profile.countDocuments({ role: "GROCERYSELLER" });
      const totalPages = Math.ceil(total / rowsPerPage);
      return res.status(200).json({
        status: true,
        data: user,
        pagination: {
          totalItems: total,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: rowsPerPage,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
   shoppingseller: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 0;
      const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;

      const user = await Profile.find({ role: "SHOPPINGSELLER" })
      .sort({ createdAt: -1 })
        .skip(page * rowsPerPage)
        .limit(rowsPerPage);

      const total = await Profile.countDocuments({ role: "SHOPPINGSELLER" });
      const totalPages = Math.ceil(total / rowsPerPage);
      return res.status(200).json({
        status: true,
        data: user,
        pagination: {
          totalItems: total,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: rowsPerPage,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getProfileById: async (req, res) => {
    try {
      const user = await Profile.findById(req.params.id);
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateStatus: async (req, res) => {
    try {
      const newresponse = await Profile.findByIdAndUpdate(
        req.params.id,
        { $set: { status: req.body.verified } },
        { new: true }
      );
      if (!newresponse) {
        return response.error(res, "User not found", 404);
      }
      if (req.body.verified === "VERIFIED") {
        await notify(
          newresponse?.user,
          "Account Verified",
          "Your account is now verified",
          newresponse?.role === "FOODSELLER" ? "FOOD" : newresponse?.role === "GROCERYSELLER" ? "GROCERY" : newresponse?.role === "SHOPPINGSELLER" ? "SHOPPING" : null
        );
      }
      if (req.body.verified === "SUSPEND") {
        await notify(
          newresponse?.user,
          "Account Suspended",
          "Your account is suspended",
          newresponse?.role === "FOODSELLER" ? "FOOD" : newresponse?.role === "GROCERYSELLER" ? "GROCERY" : newresponse?.role === "SHOPPINGSELLER" ? "SHOPPING" : null
        );
      }
      return response.ok(res, newresponse);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateSubscriptionPlanin: async (req, res) => {
    try {
      const data = await Profile.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, upsert: true }
      );
      console.log("data updated");
      return response.ok(res, { message: "Payment Succesfull", data });
    } catch (error) {
      return response.error(res, error);
    }
  },

  fileUpload: async (req, res) => {
    try {
      let key = req.file && req.file.key;
      return response.ok(res, {
        message: "File uploaded.",
        file: `${process.env.ASSET_ROOT}/${key}`,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  deleteProfile: async (req, res) => {
    try {
      const user = await Profile.findByIdAndDelete(req.params.id);
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },
  ////////for admin ////////////
  signUp: async (req, res) => {
    try {
      let user = new User({
        phone: req?.body?.phone,
        type: "ADMIN",
      });
      user.password = user.encryptPassword(req?.body?.password);
      await user.save();
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      return response.error(res, error);
    }
  },
  login: (req, res) => {
    // console.log(req.body);
    passport.authenticate("local", async (err, user, info) => {
      if (err) {
        return response.error(res, err);
      }
      if (!user) {
        return response.unAuthorize(res, info);
      }
      console.log("user=======>>", user);
      // user.tokenVersion = uuidv4();
      let token = await new jwtService().createJwtToken({
        id: user._id,
        type: user.type,
        // tokenVersion: user.tokenVersion
      });
      // console.log(req.body)
      // await Device.updateOne(
      //   { device_token: req.body.device_token },
      //   { $set: { player_id: req.body.player_id, user: user._id } },
      //   { upsert: true }
      // );
      const data = {
        token,
        ...user._doc,
      };
      delete data.password;
      return response.ok(res, data);
    })(req, res);
  },

  // DELIVERYRIDER for all three modules
  getDeliveryRider: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 0;
      const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;

      const user = await Profile.find({ role: "DELIVERYRIDER" })
      .sort({ createdAt: -1 })
        .skip(page * rowsPerPage)
        .limit(rowsPerPage);

      const total = await Profile.countDocuments({ role: "DELIVERYRIDER" });
      const totalPages = Math.ceil(total / rowsPerPage);
      return res.status(200).json({
        status: true,
        data: user,
        pagination: {
          totalItems: total,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: rowsPerPage,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
    getTax: async (req, res) => {
    try {
      const taxes = await Tax.find();
      if (!taxes || taxes?.length === 0) {
        return response.notFound(res, { message: "No tax found" });
      }
      return response.ok(res, taxes);
    } catch (error) {
      return response.error(res, error);
    }
  },

  addOrUpdateTax: async (req, res) => {
    try {
      const payload = req.body;

      const updatedTax = await Tax.findOneAndUpdate(
        // { userId: payload.userId },
        {},
        payload,
        { new: true, upsert: true, runValidators: true }
      );

      return response.ok(res, {
        message: "Tax updated successfully.",
        // message: updatedTax ? "Tax updated successfully." : "Tax added successfully.",
        data: updatedTax,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
    driverupdatelocation: async (req, res) => {
    try {
      const track = req.body?.track;
      if (!track) {
    return response.error(res, "Location not provided");
  }
      await Profile.updateMany(
        { user: req.user.id, role: { $in: ["DELIVERYRIDER", "RIDEDRIVER"] } },
        { $set: { current_location: track } }
           );
      return response.ok(res, {message:"Location Update successfully"});
    } catch (error) {
      return response.error(res, error);
    }
  },
   getnearbystore: async (req, res) => {
    try {
    const payload=req.body
      const pipeline = [
  {
    $geoNear: {
      near: payload.location, // { type: "Point", coordinates: [lng, lat] }
      distanceField: "distance", // field where distance will be stored
      maxDistance: 1609.34 * 8, // 8 miles in meters
      spherical: true,
      query: {
        role: payload.role,
        status: "VERIFIED",
      }
    }
  },
];
      if (payload.key) {
        pipeline.push({
          $match: { store_name: { $regex: payload.key, $options: "i" } },
        });
      }
      const users = await Profile.aggregate(pipeline);
      return response.ok(res, users);
    } catch (error) {
      return response.error(res, error);
    }
  },
};
