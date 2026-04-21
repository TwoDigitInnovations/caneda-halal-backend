const mongoose = require("mongoose");
const Shipping = mongoose.model('Shipping');
const jwt = require("jsonwebtoken");
const response = require("./../responses");

module.exports = {

    createShipping:async(req,res)=>{
        try {
              const payload = req?.body || {};
              let cat = new Shipping(payload);
              await cat.save();
              return response.ok(res, { message: "Shipping create successfully" });
            } catch (error) {
              return response.error(res, error);
            }
    },
    updateShipping: async (req, res) => {
        try {
          await Shipping.findByIdAndUpdate(req.body.id, req.body);
          return response.ok(res, { message: "Shipping updated" });
        } catch (error) {
          console.log(error);
          return response.error(res, error);
        }
      },
    webhookShippingUpdate: async (req, res) => {
      try {
    const signature = req.headers["x-easyship-signature"];
    if (!signature) return res.sendStatus(200);
console.log("Easyship webhook received:", req.body);
jwt.verify(signature, process.env.EASYSHIP_WEBHOOK_SECRET);

    const { event_type, data } = req.body;
    const easyship_shipment_id = data?.easyship_shipment_id;

    if (!easyship_shipment_id) return res.sendStatus(200);

    switch (event_type) {

      case "shipment.label.created":
        await Shipping.updateOne(
          { easyship_shipment_id },
          {
            labelUrl: data.label_url,
            trackingNumber: data.tracking_number,
            status: "WAITING_FOR_PICKUP",
            trackingPageUrl: data.tracking_page_url
          }
        );
        break;

      case "shipment.label.failed":
        await Shipping.updateOne(
          { easyship_shipment_id },
          {
            status: "LABEL_FAILED",
            failureReason: data.error_messages?.[0]?.message || "Label generation failed"
          }
        );
        break;

      case "shipment.tracking.status.changed":
        await Shipping.updateOne(
          { easyship_shipment_id },
          {
            trackingNumber: data.tracking_number,
            status: data.status,
            lastTrackingStatus: data.status,
            trackingPageUrl: data.tracking_page_url
          }
        );
        break;

      case "shipment.tracking.checkpoints.created":
        await Shipping.updateOne(
          { easyship_shipment_id },
          {
      $push: {
        checkpoints: {
          $each: data.checkpoints.map(cp => ({
            location: cp.location || "",
            message: cp.message || cp.status || "",
            status: cp.status,
            trackedAt: cp.tracked_at ? new Date(cp.tracked_at) : new Date()
          }))
        }
      },
      easyshipTrackingStatus: data.status,
      trackingPageUrl: data.tracking_page_url
    }
        );
        break;

      case "shipment.cancelled":
        await Shipping.updateOne(
          { easyship_shipment_id },
          { status: "CANCELLED" }
        );
        break;

      default:
        console.log("Unhandled Easyship event:", event_type);
    }

    return res.sendStatus(200);

  } catch (err) {
    console.error("Easyship webhook error:", err);
    return res.sendStatus(200);
  }
      },

}