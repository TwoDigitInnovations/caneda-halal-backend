const mongoose = require("mongoose");
const response = require("../responses");
const TRUCKTYPE = mongoose.model("TRUCKTYPE")
module.exports = {
    posttrucktype: async (req, res) => {
        // try {
        //     const data = req.body
        //     const newService = new TRUCKTYPE(data);
        //     const newresponse = await newService.save();
        //     console.log('data saved');
        //     return response.ok(res, { message: "trucktype Created", newresponse });
        //     // res.status(200).json(response);
        // } catch (err) {
        //     console.log(err);
        //     return response.error(res, err);
        //     // res.status(500).json({error:'Internal Server Error'});
        // }


        try {
            const { name, ratePerKm, maxPassengers } = req.body;
            
            let vehicleimg = "";
            
            if (req.file) {
              
              vehicleimg = req.file.location; 
            }
            
        
            const newTruckType = new TRUCKTYPE({
              name,
              vehicleimg,
              ratePerKm,
              maxPassengers
            });
            
            const newresponse = await newTruckType.save();
            
            console.log("Truck type data saved");
            
            return response.ok(res, {
              message: "Truck type created successfully",
              newresponse
            });
            
          } catch (err) {
            console.log("Error creating truck type:", err);
            return response.error(res, err);
          }
        
    },
    getalltrucktype: async (req, res) => {
        try {
            let cond = {
                status: { $regex: /^active$/i }
            }
            if (req.query.admin) {
                cond = {}
            }
            const data = await TRUCKTYPE.find(cond).sort({ createdAt: 1 });;
            console.log('data fetched');
            return response.ok(res, data);
            // res.status(200).json(data);
        } catch (err) {
            console.log(err);
            return response.error(res, err);
            // res.status(500).json({error:'Internal Server Error'});
        }
    },
    gettrucktype: async (req, res) => {
        try {
            const serviceid = await TRUCKTYPE.findById(
                req?.params?.id
            )
            console.log('data fetched');
            res.status(200).json(serviceid);
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    updatetrucktype: async (req, res) => {
        // try {
        //     const BasicdataId = req.params.id;
        //     const BasicdataData = req.body;
        //     console.log("Incoming data to update:", BasicdataData);
        //     const newresponse = await TRUCKTYPE.findByIdAndUpdate(BasicdataId, BasicdataData, {
        //         new: true,//return the updateed document
        //         runValidators: true, //Run Mongoose validation
        //     });
        //     if (!response) {
        //         return res.status(404).json({ error: 'Service not found' });
        //     }
        //     console.log('data updated');
        //     return response.ok(res, { message: "trucktype updated", newresponse });
        //     // res.status(200).json(response);

        // } catch (err) {
        //     console.log(err);
        //     return response.error(res, err);
        //     // res.status(500).json({error:'Internal Server Error'});
        // }

        
        try {
            const BasicdataId = req.params.id;
            const { name, ratePerKm, maxPassengers } = req.body;
        
            let updatedData = {
              name,
              ratePerKm: Number(ratePerKm),
              maxPassengers: Number(maxPassengers),
            };
        
         
            Object.keys(updatedData).forEach(key => {
              if (updatedData[key] === undefined || updatedData[key] === "") {
                delete updatedData[key];
              }
            });
        
            if (req.file) {
            
              updatedData.vehicleimg = req.file.location;
            }
        
            console.log("Final update data:", updatedData);
        
            const newresponse = await TRUCKTYPE.findByIdAndUpdate(BasicdataId, updatedData, {
              new: true,
              runValidators: true
            });
        
            if (!newresponse) {
              return res.status(404).json({ error: "Truck type not found" });
            }
        
            return response.ok(res, {
              message: "Truck type updated successfully",
              newresponse
            });
        
          } catch (err) {
            console.error("Update error:", err);
            return response.error(res, err);
          }
        

    },
    deletetrucktype: async (req, res) => {
        try {
            const BasicdataId = req.params.id;
            const newresponse = await TRUCKTYPE.findByIdAndDelete(BasicdataId);
            if (!response) {
                return res.status(404).json({ error: 'trucktype not found' });
            }
            console.log('data updated');
            return response.ok(res, { message: "trucktype delete", newresponse });
            // res.status(200).json(response);

        } catch (err) {
            console.log(err);
            return response.error(res, err);
            // res.status(500).json({error:'Internal Server Error'});
        }
    },
}