"use strict";
const router = require("express").Router();
const { default: mongoose } = require("mongoose");
const isAuthenticated = require("./../../middlewares/isAuthenticated");
const user = require("../../app/controller/user");
const ride = require("../../app/controller/ride");
const { upload } = require("../../app/services/fileUpload");
const trucktype = require("../../app/controller/trucktype");
const notification = require("../../app/controller/notification");
const foodcategory = require("../../app/controller/foodcategory");
const food = require("../../app/controller/food");
const Review = require("../../app/controller/driverReview");
const foodorder = require("../../app/controller/foodorder");
const grocerycategory = require("../../app/controller/grocerycategory");
const grocery = require("../../app/controller/grocery");
const groceryorder = require("../../app/controller/groceryorder");
const groceryCarousel = require("../../app/controller/groceryCarousel");
const shoppingcategory = require("../../app/controller/shoppingcategory");
const shopping = require("../../app/controller/shopping");
const shoppingorder = require("../../app/controller/shoppingorder");
const shoppingCarousel = require("../../app/controller/shoppingCarousel");
const bookingCarousel1 = require("../../app/controller/bookingCarousel1");
const bookingCarousel2 = require("../../app/controller/bookingCarousel2");
const ridePaymentOption = require("../../app/controller/ridePaymentOption");
const subscriptionController = require("../../app/controller/subscriptionController");
const transaction = require("../../app/controller/transaction");
const coupon = require("../../app/controller/coupon");
const stripe = require("../../app/controller/stripe");
const invoice = require("../../app/controller/invoice");
const shipping = require("../../app/controller/shipping");
const flightapi = require("../../app/controller/flightapi");
const bookinghistory = require("../../app/controller/bookinghistory");


////stripe
router.post("/poststripe", stripe.poststripe);

router.post("/sendotp", user.sendOTP);
router.post("/verifyOTP", user.verifyOTP);
router.post("/user/fileupload", upload.single("file"), user.fileUpload);
router.get(
  "/getProfile/:role",
  isAuthenticated(["USER", "ADMIN"]),
  user.getProfile
);
router.post(
  "/updateProfile/:role",
  isAuthenticated(["USER", "ADMIN"]),
  user.updateProfile
);
// Driver
router.get("/getAllDriver", user.getAllDriver);
router.post("/verifydriver/:id", user.verifydriver);
router.delete("/deleteProfile/:id", user.deleteProfile);
router.post("/driverupdatelocation", isAuthenticated(["USER","ADMIN"]), user.driverupdatelocation);

// Food Seller
router.get("/getAllfoodseller", user.getAllfoodseller);


// grocerySeller 
router.get('/grocryseller',user.grocryseller)
// shoppingSeller 
router.get('/shoppingseller',user.shoppingseller)
// Seller and Driver
router.get("/getProfileById/:id", user.getProfileById);
router.post("/updateStatus/:id", upload.none(), user.updateStatus);

router.put("/updateSubscriptionPlanin/:id", user.updateSubscriptionPlanin);
router.post("/getnearbystore", user.getnearbystore);

router.get(
  "/getCombinedProfile",
  isAuthenticated(["USER", "ADMIN"]),
  user.getCombinedProfile
);
router.get(
  "/getProfileStatus",
  isAuthenticated(["USER", "ADMIN"]),
  user.getProfileStatus
);
////Tax
router.post("/addOrUpdateTax", isAuthenticated(["ADMIN"]), user.addOrUpdateTax);
router.get("/getTax", user.getTax);

///for admin
router.post("/signUp", user.signUp);
router.post("/login", user.login);

//ride
router.post("/createRide", isAuthenticated(["USER"]), ride.createRide);
router.post("/nearbyrides", isAuthenticated(["USER"]), ride.nearbyrides);
router.get("/getRidebyid/:id", isAuthenticated(["USER", "ADMIN"]), ride.getRidebyid);
router.get("/getpostedRide", isAuthenticated(["USER"]), ride.getpostedRide);
router.get("/rejectRide/:id", isAuthenticated(["USER"]), ride.rejectRide);
router.get("/acceptRide/:id", isAuthenticated(["USER"]), ride.acceptRide);
router.get("/getacceptedRide", isAuthenticated(["USER"]), ride.getacceptedRide);
router.post("/startRide", isAuthenticated(["USER"]), ride.startRide);
router.get("/completeRide/:id", isAuthenticated(["USER"]), ride.completeRide);
router.get("/cancelRide/:id", isAuthenticated(["USER"]), ride.cancelRide);
router.post("/updatePayment", isAuthenticated(["USER"]), ride.updatePayment);
router.get("/ridedriverhistry", isAuthenticated(["USER"]), ride.ridedriverhistry);
// Admin: Rides list
router.get("/admin/rides", isAuthenticated(["ADMIN"]), ride.getAllRidesAdmin);

///notification
router.get(
  "/getnotification",
  isAuthenticated(["USER", "ADMIN"]),
  notification.getnotification
);

//trucktype
router.post(
  "/posttrucktype",
  upload.single("vehicleimg"),
  trucktype.posttrucktype
);
router.get("/getalltrucktype", trucktype.getalltrucktype);
router.get("/gettrucktype/:id", trucktype.gettrucktype);
router.put(
  "/updatetrucktype/:id",
  upload.single("vehicleimg"),
  trucktype.updatetrucktype
);
router.delete("/deletetrucktype/:id", trucktype.deletetrucktype);

//FoodCategory
router.get("/getFoodCategoryById/:id", foodcategory.getFoodCategoryById);
router.post(
  "/createFoodCategory",
  upload.single("file"),
  foodcategory.createFoodCategory
);
router.get("/getFoodCategory", foodcategory.getFoodCategory);
router.post(
  "/updateFoodCategory/:id",
  upload.single("file"),
  isAuthenticated(["ADMIN"]),
  foodcategory.updateFoodCategory
);
router.delete(
  "/deleteFoodCategory/:id",
  isAuthenticated(["ADMIN"]),
  foodcategory.deleteFoodCategory
);
router.post(
  "/deleteAllFoodCategory",
  isAuthenticated(["USER", "ADMIN"]),
  foodcategory.deleteAllFoodCategory
);
router.get(
  "/getCategoryWithFoods",
  isAuthenticated(["USER", "ADMIN"]),
  foodcategory.getCategoryWithFoods
);
router.get(
  "/getSellerCategoryWithFoods",
  isAuthenticated(["USER", "ADMIN"]),
  foodcategory.getSellerCategoryWithFoods
);

//GroceryCategory
router.get("/getGroceryCategoryById/:id", grocerycategory.getGroceryCategoryById);
router.post(
  "/createGroceryCategory",
  upload.single("file"),
  isAuthenticated(["ADMIN"]),
  grocerycategory.createGroceryCategory
);
router.get("/getGroceryCategory", grocerycategory.getGroceryCategory);
router.post(
  "/updateGroceryCategory/:id",
  upload.single("file"),
  isAuthenticated(["ADMIN"]),
  grocerycategory.updateGroceryCategory
);
router.delete(
  "/deleteGroceryCategory/:id",
  isAuthenticated(["ADMIN"]),
  grocerycategory.deleteGroceryCategory
);
router.post(
  "/deleteAllGroceryCategory",
  isAuthenticated(["USER", "ADMIN"]),
  grocerycategory.deleteAllGroceryCategory
);
router.get(
  "/getCategoryWithGrocerys",
  isAuthenticated(["USER", "ADMIN"]),
  grocerycategory.getCategoryWithGrocerys
);
router.get(
  "/getSellerCategoryWithGrocerys",
  isAuthenticated(["USER", "ADMIN"]),
  grocerycategory.getSellerCategoryWithGrocerys
);
//ShoppingCategory
router.get("/getShoppingCategoryById/:id", shoppingcategory.getShoppingCategoryById);
router.post(
  "/createShoppingCategory",
  upload.single("file"),
  isAuthenticated(["ADMIN"]),
  shoppingcategory.createShoppingCategory
);
router.get("/getShoppingCategory", shoppingcategory.getShoppingCategory);
router.post(
  "/updateShoppingCategory/:id",
  upload.single("file"),
  isAuthenticated(["ADMIN"]),
  shoppingcategory.updateShoppingCategory
);
router.delete(
  "/deleteShoppingCategory/:id",
  isAuthenticated(["ADMIN"]),
  shoppingcategory.deleteShoppingCategory
);
router.post(
  "/deleteAllShoppingCategory",
  isAuthenticated(["USER", "ADMIN"]),
  shoppingcategory.deleteAllShoppingCategory
);
// router.get(
//   "/getCategoryWithShoppings",
//   isAuthenticated(["USER", "ADMIN"]),
//   shoppingcategory.getCategoryWithShoppings
// );
router.get(
  "/getSellerCategoryWithShoppings",
  isAuthenticated(["USER", "ADMIN"]),
  shoppingcategory.getSellerCategoryWithShoppings
);

///Food
router.get("/getFoodById/:id", food.getFoodById);
router.get("/getTopFoodBySeller/:sellerId", food.getTopFoodBySeller);
router.get("/getFoodbycategory/:id", food.getFoodbycategory);
router.post("/updateFood", food.updateFood);
router.post("/createFood", isAuthenticated(["USER", "ADMIN"]), food.createFood);
router.get("/getFoods", food.getFoods);
router.get(
  "/getFoodforseller",
  isAuthenticated(["USER", "ADMIN"]),
  food.getFoodforseller
);
router.get("/foodSearch", isAuthenticated(["USER", "ADMIN"]), food.foodSearch);
router.delete("/deleteFood/:id", isAuthenticated(["USER"]), food.deleteFood);
router.get("/getFavoriteFoods", isAuthenticated(["USER","ADMIN"]), food.getFavoriteFoods);

///Grocery
router.get("/getGroceryById/:id", grocery.getGroceryById);
router.get("/getTopGroceryBySeller/:sellerId", grocery.getTopGroceryBySeller);
router.get("/getTopSoldGrocery", grocery.getTopSoldGrocery);
router.get("/getGrocerybycategory/:id", grocery.getGrocerybycategory);
router.post("/updateGrocery", grocery.updateGrocery);
router.post("/createGrocery", isAuthenticated(["USER", "ADMIN"]), grocery.createGrocery);
router.get(
  "/getGroceryforseller",
  isAuthenticated(["USER", "ADMIN"]),
  grocery.getGroceryforseller
);
router.get("/grocerySearch", isAuthenticated(["USER", "ADMIN"]), grocery.grocerySearch);
router.delete("/deleteGrocery/:id", isAuthenticated(["USER"]), grocery.deleteGrocery);
///Shopping
router.get("/getShoppingById/:id", shopping.getShoppingById);
router.get("/getTopSoldShopping", shopping.getTopSoldShopping);
router.get("/getShoppingbycategory/:id", shopping.getShoppingbycategory);
router.post("/updateShopping", shopping.updateShopping);
router.post("/createShopping", isAuthenticated(["USER", "ADMIN"]),shopping.createShopping);
router.get("/getShopping", shopping.getShopping);
router.get(
  "/getShoppingforseller",
  isAuthenticated(["USER", "ADMIN"]),
  shopping.getShoppingforseller
);
router.get("/shoppingSearch", isAuthenticated(["USER", "ADMIN"]), shopping.shoppingSearch);
router.delete("/deleteShopping/:id", isAuthenticated(["USER"]), shopping.deleteShopping);

// Subscription
router.post(
  "/createSubscription",
  isAuthenticated(["ADMIN"]),
  subscriptionController.create
);
router.delete(
  "/deleteSubscription/:id",
  isAuthenticated(["ADMIN"]),
  subscriptionController.delete
);
router.put(
  "/updateSubscription/:id",
  isAuthenticated(["ADMIN"]),
  subscriptionController.update
);
router.get(
  "/getActiveSubscription",
  isAuthenticated(["USER", "ADMIN"]),
  subscriptionController.getActiveSubscription
);
router.get(
  "/getSubscription",
  isAuthenticated(["ADMIN"]),
  subscriptionController.getFAQ
);
router.patch(
  "/changestatus/:id",
  isAuthenticated(["ADMIN"]),
  subscriptionController.changestatus
);

router.post(
  "/changeAllStatus",
  isAuthenticated(["ADMIN"]),
  subscriptionController.changeAllStatus
);

///Foodorder///
router.post("/createfoodorder", foodorder.createfoodorder);
router.get(
  "/getfoodorderforuser",
  isAuthenticated(["USER"]),
  foodorder.getfoodorderforuser
);
router.get(
  "/getpendingfoodorderforseller",
  isAuthenticated(["USER"]),
  foodorder.getpendingfoodorderforseller
);
router.get(
  "/getrunningfoodorderforseller",
  isAuthenticated(["USER"]),
  foodorder.getrunningfoodorderforseller
);
router.post("/changefoodorderstatus", foodorder.changefoodorderstatus);
router.post("/deliverybyseller", foodorder.deliverybyseller);
router.get(
  "/sellermostsellingitems",
  isAuthenticated(["USER"]),
  foodorder.sellermostsellingitems
);
router.post(
  "/nearbyordersfordriver",
  isAuthenticated(["USER"]),
  foodorder.nearbyordersfordriver
);
router.get(
  "/rejectfoodOrder/:id",
  isAuthenticated(["USER"]),
  foodorder.rejectfoodOrder
);
router.get(
  "/acceptfoodorder/:id",
  isAuthenticated(["USER"]),
  foodorder.acceptfoodOrder
);
router.get(
  "/acceptedfoodorderfordriver",
  isAuthenticated(["USER"]),
  foodorder.acceptedfoodorderfordriver
);
router.get("/getfoodorderbyid/:id", foodorder.getfoodorderbyid);
router.get(
  "/foodorderhistoryfordriver",
  isAuthenticated(["USER"]),
  foodorder.foodorderhistoryfordriver
);
router.get(
  "/foodorderhistoryforseller",
  isAuthenticated(["USER"]),
  foodorder.foodorderhistoryforseller
);

// Admin: Food orders list
router.get(
  "/admin/food/orders",
  isAuthenticated(["ADMIN"]),
  foodorder.getAllFoodOrdersAdmin
);

///Groceryorder///
router.post("/creategroceryorder", groceryorder.creategroceryorder);
router.get(
  "/getgroceryorderforuser",
  isAuthenticated(["USER"]),
  groceryorder.getgroceryorderforuser
);
router.get(
  "/getpendinggroceryorderforseller",
  isAuthenticated(["USER"]),
  groceryorder.getpendinggroceryorderforseller
);
router.get(
  "/getrunninggroceryorderforseller",
  isAuthenticated(["USER"]),
  groceryorder.getrunninggroceryorderforseller
);
router.post("/changegroceryorderstatus", groceryorder.changegroceryorderstatus);
router.post("/deliverybygroceryseller", groceryorder.deliverybygroceryseller);
router.get(
  "/sellermostsellinggroceryitems",
  isAuthenticated(["USER"]),
  groceryorder.sellermostsellinggroceryitems
);
// router.post(
//   "/nearbygroceryorderfordriver",
//   isAuthenticated(["USER"]),
//   groceryorder.nearbygroceryorderfordriver
// );
router.get(
  "/rejectgroceryOrder/:id",
  isAuthenticated(["USER"]),
  groceryorder.rejectgroceryOrder
);
router.get(
  "/acceptgroceryorder/:id",
  isAuthenticated(["USER"]),
  groceryorder.acceptgroceryOrder
);
router.get(
  "/acceptedgroceryorderfordriver",
  isAuthenticated(["USER"]),
  groceryorder.acceptedgroceryorderfordriver
);
router.get("/getgroceryorderbyid/:id", groceryorder.getgroceryorderbyid);
router.get(
  "/groceryorderhistoryfordriver",
  isAuthenticated(["USER"]),
  groceryorder.groceryorderhistoryfordriver
);
router.get(
  "/groceryorderhistoryforseller",
  isAuthenticated(["USER"]),
  groceryorder.groceryorderhistoryforseller
);

// Admin: Grocery orders list
router.get(
  "/admin/grocery/orders",
  isAuthenticated(["ADMIN"]),
  groceryorder.getAllGroceryOrdersAdmin
);
///Shoppingorder///
router.post("/createshoppingorder", shoppingorder.createshoppingorder);
router.get(
  "/getshoppingorderforuser",
  isAuthenticated(["USER"]),
  shoppingorder.getshoppingorderforuser
);
router.get(
  "/getpendingshoppingorderforseller",
  isAuthenticated(["USER"]),
  shoppingorder.getpendingshoppingorderforseller
);
router.get(
  "/getrunningshoppingorderforseller",
  isAuthenticated(["USER"]),
  shoppingorder.getrunningshoppingorderforseller
);
router.post("/changeshoppingorderstatus", shoppingorder.changeshoppingorderstatus);
router.post("/deliverybyshoppingseller", shoppingorder.deliverybyshoppingseller);
router.get(
  "/sellermostsellingshoppingitems",
  isAuthenticated(["USER"]),
  shoppingorder.sellermostsellingshoppingitems
);
// router.post(
//   "/nearbyshoppingorderfordriver",
//   isAuthenticated(["USER"]),
//   shoppingorder.nearbyshoppingorderfordriver
// );
router.get(
  "/rejectshoppingOrder/:id",
  isAuthenticated(["USER"]),
  shoppingorder.rejectshoppingOrder
);
router.get(
  "/acceptshoppingorder/:id",
  isAuthenticated(["USER"]),
  shoppingorder.acceptshoppingOrder
);
router.get(
  "/acceptedshoppingorderfordriver",
  isAuthenticated(["USER"]),
  shoppingorder.acceptedshoppingorderfordriver
);
router.get("/getshoppingorderbyid/:id", shoppingorder.getshoppingorderbyid);
router.get(
  "/shoppingorderhistoryfordriver",
  isAuthenticated(["USER"]),
  shoppingorder.shoppingorderhistoryfordriver
);
router.get(
  "/shoppingorderhistoryforseller",
  isAuthenticated(["USER"]),
  shoppingorder.shoppingorderhistoryforseller
);

// Admin: Shopping orders list
router.get(
  "/admin/shopping/orders",
  isAuthenticated(["ADMIN"]),
  shoppingorder.getAllShoppingOrdersAdmin
);

//Favorite and rating and review - Grocery
router.post("/grocerytogglefavorite", isAuthenticated(["USER"]), grocery.togglefavorite);
router.get("/grocerygetfavorite", isAuthenticated(["USER"]), grocery.getfavorite);
router.post("/groceryaddreview", isAuthenticated(["USER"]), grocery.addreview);
router.get("/grocerygetreview/:id", isAuthenticated(["USER"]), grocery.getreview);
router.get("/grocerygetreviewbyseller", isAuthenticated(["USER"]), grocery.getreviewByseller);
router.get("/grocerygetallreview", isAuthenticated(["USER"]), grocery.getallreview);

//Favorite and rating and review - Food
router.post("/togglefavorite", isAuthenticated(["USER"]), food.togglefavorite);

router.get("/getfavorite", isAuthenticated(["USER"]), food.getfavorite);

router.post("/addreview", isAuthenticated(["USER"]), food.addreview);

router.get("/getreview/:id", isAuthenticated(["USER"]), food.getreview);

router.get(
  "/getreviewbyseller",
  isAuthenticated(["USER"]),
  food.getreviewByseller
);

router.get(
  "/getallreview",
  isAuthenticated(["USER"]),
  // isAuthenticated(["ADMIN"]),   // Will be admin user is for testing only
  food.getallreview
);

// DELIVERYRIDER for all three modules
router.get(
  "/getDeliveryRider",
  isAuthenticated(["USER", "ADMIN"]),
  user.getDeliveryRider
);

/////Transaction /////
router.post(
  "/createTransaction",
  isAuthenticated(["USER", "ADMIN"]),
  transaction.createTransaction
);
router.get(
  "/getTransaction/:id",
  isAuthenticated(["USER", "ADMIN"]),
  transaction.getTransaction
);
router.get(
  "/getAllTransaction",
  isAuthenticated(["USER", "ADMIN"]),
  transaction.getAllTransaction
);
router.post(
  "/updateTransaction/:id",
  isAuthenticated(["USER", "ADMIN"]),
  transaction.updateTransaction
);
router.get(
  "/getSellerRevenue",
  isAuthenticated(["USER"]),
  transaction.getSellerRevenue
);
router.get(
  "/getPendingTransaction",
  isAuthenticated(["USER", "ADMIN"]),
  transaction.getPendingTransaction
);

//Coupon
router.post("/postcoupon", coupon.postcoupon);
router.get("/getallcoupon", coupon.getallcoupon);
router.put("/updatecoupon/:id", coupon.updatecoupon);
router.delete("/deletecoupon/:id", coupon.deletecoupon);

//////GroceryCarosal
router.post("/createGroceryCarousel", groceryCarousel.createGroceryCarousel);
router.get("/getGroceryCarousel", groceryCarousel.getGroceryCarousel);
router.post(
    "/updateGroceryCarousel",
    groceryCarousel.updateGroceryCarousel)
//////ShoppingCarosal
router.post("/createShoppingCarousel", shoppingCarousel.createShoppingCarousel);
router.get("/getShoppingCarousel", shoppingCarousel.getShoppingCarousel);
router.post(
    "/updateShoppingCarousel",
    shoppingCarousel.updateShoppingCarousel)

//////BookingCarousel1
router.post("/createBookingCarousel1", bookingCarousel1.createBookingCarousel1);
router.get("/getBookingCarousel1", bookingCarousel1.getBookingCarousel1);
router.post(
    "/updateBookingCarousel1",
    bookingCarousel1.updateBookingCarousel1)

//////BookingCarousel2
router.post("/createBookingCarousel2", bookingCarousel2.createBookingCarousel2);
router.get("/getBookingCarousel2", bookingCarousel2.getBookingCarousel2);
router.post(
    "/updateBookingCarousel2",
    bookingCarousel2.updateBookingCarousel2)

//////RidePaymentOption
router.post("/createRidePaymentOption", ridePaymentOption.createRidePaymentOption);
router.get("/getRidePaymentOption", ridePaymentOption.getRidePaymentOption);
router.post(
    "/updateRidePaymentOption",
    ridePaymentOption.updateRidePaymentOption)
/// Driver Review
router.post("/adddriverreview", isAuthenticated(["USER"]), Review.addreview);

router.get("/getridereview/:id", isAuthenticated(["USER"]), Review.getridereview);

router.get(
  "/getallreviewBydriver",
  isAuthenticated(["USER"]),
  Review.getallreviewBydriver
);
//////Invoice
router.get("/generateInvoice", invoice.generateInvoice);
router.get("/generateRideInvoice", invoice.generateRideInvoice);


//////Flight API
router.get("/flight/locations",  isAuthenticated(["USER"]), flightapi.flightLocations);
router.post("/flight/search",  isAuthenticated(["USER"]), flightapi.searchFlight);
router.post("/flight/multicity-search",  isAuthenticated(["USER"]), flightapi.multiCitySearch);
router.post("/flight/fare-quote",  isAuthenticated(["USER"]), flightapi.fareQuote);
router.get("/flight/fare-rules",   isAuthenticated(["USER"]), flightapi.fareRules);
router.get("/flight/seat-map",  isAuthenticated(["USER"]), flightapi.seatMap);
router.post("/flight/book", isAuthenticated(["USER", "ADMIN"]), flightapi.bookFlight);
router.get("/flight/booking",  isAuthenticated(["USER"]), flightapi.getBookingDetails);
router.post("/flight/cancellation-charges",  isAuthenticated(["USER"]), flightapi.getCancellationCharges);
router.post("/flight/cancel",  isAuthenticated(["USER"]), flightapi.cancelBooking);

//////Shipping
router.post("/createShipping", shipping.createShipping);
router.post("/updateShipping", shipping.updateShipping);
router.post("/webhookShippingUpdate", shipping.webhookShippingUpdate);

//////Booking History
router.post("/createBookingHistory", isAuthenticated(["USER", "ADMIN"]), bookinghistory.createBookingHistory);
router.get("/getBookingHistoryByUser", isAuthenticated(["USER", "ADMIN"]), bookinghistory.getBookingHistoryByUser);
router.get("/getBookingHistoryById/:id", isAuthenticated(["USER", "ADMIN"]), bookinghistory.getBookingHistoryById);
// router.patch("/updateBookingHistoryStatus/:id", isAuthenticated(["USER", "ADMIN"]), bookinghistory.updateBookingHistoryStatus);
router.get("/dropBookingHistory", isAuthenticated(["ADMIN"]), bookinghistory.dropBookingHistory);   // Danger Zone

module.exports = router;
