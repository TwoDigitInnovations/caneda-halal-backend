const mongoose = require("mongoose");
const response = require("./../responses");
const Coupon = mongoose.model("Coupon")
module.exports = {
    postcoupon: async (req, res) => {
        try {
            const data = req.body
            const newService = new Coupon(data);
            const newresponse = await newService.save();
            console.log('data saved');
            return response.ok(res, { message: "Coupon Created", newresponse });
        } catch (err) {
            console.log(err);
            return response.error(res, err);
        }
    },
    getallcoupon: async (req, res) => {
        try {
            const data = await Coupon.find();
            console.log('data fetched');
            return response.ok(res, data);
        } catch (err) {
            console.log(err);
            return response.error(res, err);
        }
    },
    updatecoupon: async (req, res) => {
        try {
            const BasicdataId = req.params.id;
            const BasicdataData = req.body;
            console.group(BasicdataData)
            const newresponse = await Coupon.findByIdAndUpdate(BasicdataId, BasicdataData, {
                new: true,
                runValidators: true,
            });
            if (!newresponse) {
                return res.status(404).json({ error: 'Coupon not found' });
            }
            console.log('data updated');
            return response.ok(res, { message: "Coupon updated", newresponse });

        } catch (err) {
            console.log(err);
            return response.error(res, err);
        }

    },
    deletecoupon:async(req,res)=>{
        try {
            const BasicdataId=req.params.id;
            const newresponse=await Coupon.findByIdAndDelete(BasicdataId) ;
            if (!response) {
                return res.status(404).json({error:'Person not found'}); 
            } 
            console.log('data updated');
            return response.ok(res, { message: "Coupon updated", newresponse });

        } catch (err) {
            console.log(err);
            return response.error(res, err);
        }
    },
}