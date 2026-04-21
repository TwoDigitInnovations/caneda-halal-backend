const mongoose = require("mongoose");
const Ride = mongoose.model("Ride");
const response = require("./../responses");
const { notify, schedulenotify } = require("../services/notification");
const Profile = mongoose.model("Profile");
const Transaction = mongoose.model("Transaction");
const polyline = require("@mapbox/polyline");
const { default: axios } = require("axios");
const TRUCKTYPE = mongoose.model("TRUCKTYPE");

module.exports = {
  createRide: async (req, res) => {
    try {
      const payload = req?.body || {};
      const u = await Profile.findOne({ user: req.user.id, role: "RIDEUSER" });
      console.log("u --==>", u);
      const now = new Date();
      const date = now
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 17); // YYYYMMDDHHMMSSmmm

      payload.order_id = `CHMPR-${date}`;
      console.log("ride", payload.order_id);
      payload.user_profile = u._id;
      let data = new Ride(payload);
      let poolrid;
      if (payload?.ride_mode === "pool") {
        // const poolride= await Ride.findOne({
        //     ride_mode:"pool",
        //     // status:'started',
        //     route: {
        //     $near: {
        //       $geometry: {
        //         type: "Point",
        //         coordinates: [
        //           payload?.src.coordinates[0], // lng
        //           payload?.src.coordinates[1], // lat
        //         ],
        //       },
        //       $maxDistance: 2000, // 2 km
        //     },
        //   },
        //   })
        const poolride = await Ride.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [
                  payload.src.coordinates[0],
                  payload.src.coordinates[1],
                ], // [lng, lat]
              },
              distanceField: "distance",
              maxDistance: 2000, // 2 km
              spherical: true,
              key: "route", // field that stores your LineString
            },
          },
          { $match: { ride_mode: "pool" } },
          // { $match: { ride_mode: "pool",status:'started' } },
          { $limit: 1 },
        ]);

const stops = payload?.stops || []; // e.g. [{ coordinates: [lng, lat] }, ...]
    const waypoints = stops.length
      ? stops.map(s => `${s.location.coordinates[1]},${s.location.coordinates[0]}`).join("|")
      : null;
const params= {
              origin: `${payload?.src.coordinates[1]},${payload?.src.coordinates[0]}`,
              destination: `${payload?.dest.coordinates[1]},${payload?.dest.coordinates[0]}`,
              alternatives: false,
              key: process.env.GOOGLE_MAPS_API_KEY,
            }
            if (waypoints) params.waypoints = waypoints;
        console.log("poolride", poolride);
        const apires = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json`,
          {
            params
          }
        );

        if (!apires.data.routes.length) {
          return res.status(400).json({ message: "No routes found" });
        }
        // Decode polyline
        const encoded = apires.data.routes[0].overview_polyline.points;
        const decoded = polyline.decode(encoded); // [[lat, lng], [lat, lng]...]
        // Convert to [lng, lat] for GeoJSON
        const routs = decoded.map(([lat, lng]) => ({
          type: "Point",
          coordinates: [lng, lat],
        }));
        const lineString = decoded.map(([lat, lng]) => [lng, lat]); // Mongo expects [lng, lat]

        data.route = {
          type: "LineString",
          coordinates: lineString,
        };
        if (poolride?.length > 0) {
          poolrid = poolride;
          console.log("poolride[0].driver_id", poolride[0].driver_id);
          data.req_join_driver = poolride[0].driver_id;
          // Notify only the driver of the matched pool ride
          await notify(
            poolride[0].driver_id,
            "Someone wants to join",
            "A passenger wants to join you",
            "RIDE"
          );
        }
      } else {
        data.route = {
          type: "LineString",
          coordinates: [payload.src.coordinates, payload.dest.coordinates],
        };
      }
      await data.save();

      if (!poolrid) {
        let driverlist = await Profile.find({
          role: "RIDEDRIVER",
          location: {
            $near: {
              $maxDistance: 1609.34 * 10,
              $geometry: data.src,
            },
          },
        }).select("user -_id");
        console.log("driverlist", driverlist);
        if (driverlist.length > 0) {
          const user = [];
          driverlist.map((item) => user.push(item.user));
          if (payload.scheduleride) {
            await schedulenotify(
              user,
              "New Ride created",
              "Respond quickly before another driver accepts.",
              "RIDE",
              payload.date
            );
          } else {
            await notify(
              user,
              "New Ride created",
              "Respond quickly before another driver accepts.",
              "RIDE"
            );
          }
        }
      }
      await notify(
              req.user.id,
              "Ride Booked",
              "Your ride has been created succesfully",
              "RIDE"
            );
      return response.ok(res, data, { message: "Ride Book successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  nearbyrides: async (req, res) => {
    try {
      const Vehicledata = await TRUCKTYPE.findById(req.body.vehicle_type);
      let rideModeConditions = [
        {
          ride_mode: { $ne: "pool" },
          vehicle_type: req.body.vehicle_type,
        },
      ];
      if (Vehicledata?.maxPassengers > 2) {
        rideModeConditions.push({ ride_mode: "pool" });
      }
      let schedulerConditions = [
        { scheduleride: { $ne: true } },
        { scheduleride: true, date: { $lte: new Date() } },
      ];
      let orders = await Ride.find({
        src: {
          $near: {
            $maxDistance: 1609.34 * 10,
            $geometry: {
              type: "Point",
              coordinates: req.body.location,
            },
          },
        },
        rejectedbydriver: { $nin: [req.user.id] },
        driver_id: { $exists: false },
        status: { $ne: "cancel" },
        $and: [{ $or: rideModeConditions }, { $or: schedulerConditions }],
      })
        .sort({ createdAt: -1 })
        .populate("user user_profile");
      return response.ok(res, orders);
    } catch (err) {
      return response.error(res, err);
    }
  },
  getRidebyid: async (req, res) => {
    try {
      const data = await Ride.findById(req.params.id).populate(
        "user_profile driver_profile vehicle_type",
        "-password"
      );
      // console.log('data', data)
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getpostedRide: async (req, res) => {
    try {
      const data = await Ride.find({
        user: req.user.id,
        status: { $ne: "cancel" },
      })
        .populate("vehicle_type")
        .sort({ createdAt: -1 });
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getacceptedRide: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 10);
      const skip = (page - 1) * limit;
      const data = await Ride.find({
        driver_id: req.user.id,
        status: { $ne: "complete" },
      })
        .populate("user_profile")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip(skip);
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getAllRidesAdmin: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 10);
      const skip = (page - 1) * limit;
      const data = await Ride.find({})
        .populate("user_profile driver_profile vehicle_type")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip(skip);
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  rejectRide: async (req, res) => {
    try {
      const ride = await Ride.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { rejectedbydriver: req.user.id } }, // Add only if not already present
        { new: true } // Return updated ride
      );
      return response.ok(res, { message: "Ride rejcted" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  acceptRide: async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.id);
      if (ride.driver_id) {
        return response.badReq(res, { message: "Ride already accepted" });
      }
      const u = await Profile.findOne({
        user: req.user.id,
        role: "RIDEDRIVER",
      });
      ride.driver_id = req.user.id;
      ride.driver_profile = u._id;
      ride.save();
      await notify(
              ride?.user,
              "Driver Assigned",
              `${u?.username} has accepted your ride.`,
              "RIDE"
            );
      return response.ok(res, { message: "Ride accept" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  startRide: async (req, res) => {
    try {
      const ride = await Ride.findById(req.body.rideid);
      if (ride.otp !== req.body.otp) {
        return response.badReq(res, { message: "Wrong Pin" });
      }
      ride.status = "started";
      ride.save();
      return response.ok(res, { message: "Ride Started" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  completeRide: async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.id);
      ride.status = "complete";
      ride.save();
      await notify(
        ride.user,
        "Ride Completed",
        "Your ride is successfully completed. Thank you for riding with us!",
        "RIDE"
      );
      return response.ok(res, { message: "Ride Completed" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  cancelRide: async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.id);
      ride.status = "cancel";
      ride.save();
      if (ride.driver_id) {
        await notify(
          ride.driver_id,
          "Ride Canceled",
          "Your accepted ride is canceled",
          "RIDE"
        );
      }
      return response.ok(res, { message: "Ride Canceled" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  updatePayment: async (req, res) => {
    try {
      const data = await Ride.findById(req.body.id);
      if (!data?._id) {
        return response.badReq(res, { message: "Ride Not Found" });
      }
      data.paymentid = req.body.paymentid;
      if (req.body.delivery_tip) {
        data.delivery_tip = req.body.delivery_tip;
      }
      await data.save();
      const driver = await Profile.findById(data.driver_profile);
      driver.wallet =
        driver.wallet +
        (data.final_price ? data.final_price : data.price) +
        (req.body.delivery_tip ? req.body.delivery_tip : 0);
      await driver.save();
      const drivertxn = new Transaction({
        req_user: data.driver_id,
        req_profile: data.driver_profile,
        amount: data.final_price ? data.final_price : data.price,
        type: "EARN",
        status: "Approved",
        req_user_type: "driver",
      });
      await drivertxn.save();
      if (req.body.delivery_tip) {
        const drivertxn2 = new Transaction({
          req_user: data.driver_id,
          req_profile: data.driver_profile,
          amount: req.body.delivery_tip,
          type: "EARN",
          status: "Approved",
          req_user_type: "driver",
        });
        await drivertxn2.save();
      }

      return response.ok(res, { message: "Payment Succesfull", data });
    } catch (error) {
      return response.error(res, error);
    }
  },
  ridedriverhistry: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await Ride.find({
        driver_id: req.user.id,
        status: "complete",
      })
        .sort({ createdAt: -1 })
        .populate("user_profile")
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
};
