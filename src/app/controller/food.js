const mongoose = require("mongoose");
const Foods = mongoose.model("Foods");
const response = require("../responses");

module.exports = {
  createFood: async (req, res) => {
    try {
      const payload = req?.body || {};
      // payload.slug = payload.name
      //   .toLowerCase()
      //   .replace(/ /g, "-")
      //   .replace(/[^\w-]+/g, "");
      let cat = new Foods(payload);
      await cat.save();
      return response.ok(res, { message: "Food create successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getFoods: async (req, res) => {
    try {
      let data = await Foods.find()
        .populate("foodcategory")
        .select("-favorite -createdAt -updatedAt -__v")
        .sort({ createdAt: -1 });

      data = data.map((item) => {
        const { reviews, ...rest } = item.toObject();
        const totalRating = reviews.reduce(
          (acc, review) => acc + review.rating,
          0
        );
        const averageRating = totalRating / (reviews.length || 1);
        return {
          ...rest,
          averageRating: averageRating.toFixed(1),
          totalReviews: reviews.length,
        };
      });

      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getFoodforseller: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const cond = { sellerid: req.user.id };
      if (req.query.category) {
        cond.foodcategory = req.query.category;
      }
      let data = await Foods.find(cond)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getFoodById: async (req, res) => {
    try {
      const userId = req.query.userId;
      let data = await Foods.findById(req?.params?.id).populate("foodcategory seller_profile");
      let plainData = data.toObject();

      // Compute average rating and total reviews
      const reviews = Array.isArray(plainData.reviews) ? plainData.reviews : [];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1)
        : null;
      plainData.averageRating = averageRating;
      plainData.totalReviews = totalReviews;

      if (userId) {
          const isFavorite =
            Array.isArray(data.favorite) &&
            data.favorite.some(
              (favUserId) => favUserId.toString() === userId.toString()
            );
          plainData.isFavorite = isFavorite;
      }
      return response.ok(res, plainData);
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Returns top foods from the same seller sorted by sold_pieces (most ordered).
  // Accepts excludeIds as a comma-separated string to exclude multiple items at once
  // (used by both PreView "most ordered together" and Cart "complete your meal with").
  getTopFoodBySeller: async (req, res) => {
    try {
      const { sellerId } = req.params;
      const { limit = 10, excludeIds, userId } = req.query;

      const cond = { sellerid: mongoose.Types.ObjectId.isValid(sellerId)
        ? new mongoose.Types.ObjectId(sellerId)
        : sellerId };

      if (excludeIds) {
        const ids = excludeIds
          .split(',')
          .map(id => id.trim())
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (ids.length > 0) {
          cond._id = { $nin: ids };
        }
      }

      let foods = await Foods.find(cond)
        .populate("foodcategory seller_profile")
        .sort({ sold_pieces: -1 })
        .limit(parseInt(limit))
        .lean();

      foods = foods.map((food) => {
        const reviews = Array.isArray(food.reviews) ? food.reviews : [];
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
          ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1)
          : null;
        const isFavorite =
          userId &&
          Array.isArray(food.favorite) &&
          food.favorite.some((id) => id.toString() === userId.toString());
        return {
          ...food,
          averageRating,
          totalReviews,
          isFavorite: !!isFavorite,
        };
      });

      return response.ok(res, foods);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getFoodbycategory: async (req, res) => {
    try {
      const userId = req.query.userId;
      const { page = 1, limit = 20, lat, lng } = req.query;
      const userLat = lat ? parseFloat(lat) : null;
      const userLng = lng ? parseFloat(lng) : null;

      const cond = { foodcategory: req.params.id };
      if (req?.query?.store_id) {
        cond.sellerid = req.query.store_id;
      }

      let foods = await Foods.find(cond)
        .populate("foodcategory seller_profile")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      foods = foods.map((food) => {
        // Average rating from embedded reviews
        const reviews = Array.isArray(food.reviews) ? food.reviews : [];
        const totalRating = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        const rating = reviews.length > 0
          ? (totalRating / reviews.length).toFixed(1)
          : null;

        // Distance from user to seller location (Haversine, result in km)
        let distance = null;
        let delivery_time = null;
        const coords = food.seller_profile?.location?.coordinates;
        if (userLat != null && userLng != null && Array.isArray(coords) && coords.length === 2) {
          const sellerLng = coords[0];
          const sellerLat = coords[1];
          const R = 6371; // Earth radius in km
          const dLat = ((sellerLat - userLat) * Math.PI) / 180;
          const dLng = ((sellerLng - userLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) *
              Math.cos((sellerLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = distKm < 1
            ? `${Math.round(distKm * 1000)} m`
            : `${distKm.toFixed(1)} km`;

          // Estimated delivery time: 15 min base prep + 5 min per km travel, rounded to 5
          const raw = 15 + Math.round(distKm * 5);
          const lo = Math.ceil(raw / 5) * 5;
          delivery_time = `${lo - 5}-${lo} mins`;
        }

        // isFavorite
        const isFavorite =
          userId &&
          Array.isArray(food.favorite) &&
          food.favorite.some((id) => id.toString() === userId.toString());

        return {
          ...food,
          rating,
          distance,
          delivery_time,
          isFavorite: !!isFavorite,
        };
      });

      return response.ok(res, foods);
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateFood: async (req, res) => {
    try {
      const payload = req?.body || {};
      // if (payload.name) {
      //   payload.slug = payload.name
      //     .toLowerCase()
      //     .replace(/ /g, "-")
      //     .replace(/[^\w-]+/g, "");
      // }
      let data = await Foods.findByIdAndUpdate(payload?.id, payload, {
        new: true,
        upsert: true,
      });
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  deleteFood: async (req, res) => {
    try {
      await Foods.findByIdAndDelete(req?.params?.id);
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  foodSearch: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.query.userId;
      let cond = {
        $or: [
          { name: { $regex: req.query.key, $options: "i" } },
          { categoryName: { $regex: req.query.key, $options: "i" } },
        ],
      };
      let product = await Foods.find(cond)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
           if (userId) {
        product = product.map((food) => {
          const isFavorite =
            Array.isArray(food.favorite) &&
            food.favorite.some(
              (favUserId) => favUserId.toString() === userId.toString()
            );
          return {
            ...food.toObject?.(),
            isFavorite,
          };
        });
      }
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  togglefavorite: async (req, res) => {
    try {
      const payload = req?.body || {};
      const userId = req.user.id;

      const food = await Foods.findById(payload.foodid);

      if (!food) {
        return response.badReq(res, { message: "Food not found" });
      }

      const isFavorited = food.favorite.includes(userId);

      let updatedFood;

      if (isFavorited) {
        updatedFood = await Foods.findByIdAndUpdate(
          payload.foodid,
          { $pull: { favorite: userId } },
          { new: true }
        );
      } else {
        updatedFood = await Foods.findByIdAndUpdate(
          payload.foodid,
          { $addToSet: { favorite: userId } },
          { new: true }
        );
      }

      return response.ok(res, {
        message: isFavorited ? "Removed from favorites" : "Added to favorites",
        data: updatedFood,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getfavorite: async (req, res) => {
    try {
      const userId = req.user.id;
      const favoriteFoods = await Foods.find({
        favorite: userId,
      })
        .populate("foodcategory", "name image")
        .select("-favorite -createdAt -updatedAt -__v");

      if (!favoriteFoods || favoriteFoods.length === 0) {
        return response.badReq(res, { message: "No favorite foods found" });
      }
      return response.ok(res, favoriteFoods);
    } catch (error) {
      return response.error(res, error);
    }
  },

  addreview: async (req, res) => {
    try {
      const payload = req?.body || {};
      const userId = req.user.id;

      const food = await Foods.findById(payload.foodid);
      if (!food) {
        return response.badReq(res, { message: "Food not found" });
      }

      const existingReviewIndex = food.reviews.findIndex(
        (review) => review.userId.toString() === userId.toString()
      );

      if (existingReviewIndex !== -1) {
        food.reviews[existingReviewIndex].rating = payload.rating;
        food.reviews[existingReviewIndex].comment = payload.comment;
      } else {
        food.reviews.push({
          userId,
          userProfile:payload?.userProfile,
          rating: payload.rating,
          comment: payload.comment,
        });
      }

      await food.save();

      return response.ok(res, { message: "Review submitted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getreview: async (req, res) => {
    try {
      const food = await Foods.findById(req.params.id)
        .populate("foodcategory", "name image")
        .select("-favorite -createdAt -updatedAt -__v");

      if (!food) {
        return response.badReq(res, { message: "Food not found" });
      }

      return response.ok(res, {
        reviews: food.reviews,
        averageRating:
          food.reviews.reduce((acc, review) => acc + review.rating, 0) /
          (food.reviews.length || 1),
        totalReviews: food.reviews.length,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getreviewByseller: async (req, res) => {
    try {
      const userId = req.user.id;

      const foodItems = await Foods.find({ sellerid: userId })
        .populate("foodcategory", "name image")
        .populate("reviews.userProfile")
        .select("-favorite -updatedAt -__v");

      if (!foodItems || foodItems.length === 0) {
        return response.badReq(res, {
          message: "No food found for this seller",
        });
      }

      const userReviews = [];

      foodItems.forEach((food) => {
        food.reviews.forEach((review) => {
          userReviews.push({
            foodId: food._id,
            foodName: food.name,
            foodCategory: food.foodcategory,
            foodImage: food.image[0] || null,
            foodDescription: food.description,
            foodPrice: food.price,
            foodSeller: food.sellerid,
            user: review.userId,
            userProfile: review.userProfile,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          });
        });
      });

      if (userReviews.length === 0) {
        return response.badReq(res, {
          message: "No reviews found for this seller",
        });
      }

      const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = (totalRating / userReviews.length).toFixed(1);
      const totalReviews = userReviews.length;
      if (req?.query?.onlyreviewno) {
        return response.ok(res, {
          averageRating,
          totalReviews,
        });
      }

      const formattedReviews = userReviews
        .map((review) => ({
          ...review,
          averageRating,
          totalReviews,
          createdAt: review.createdAt
            ? new Date(review.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            : null,
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return response.ok(res, formattedReviews);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getallreview: async (req, res) => {
    try {
      const food = await Foods.find()
        .populate("foodcategory", "name image")
        .populate("reviews.userId", "username")
        .populate("sellerid", "username")
        .select("-favorite -createdAt -updatedAt -__v");

      if (!food || food.length === 0) {
        return response.badReq(res, { message: "No reviews found" });
      }

      const allReviews = food.flatMap((item) =>
        item.reviews.map((review) => ({
          foodId: item._id,
          foodName: item.name,
          user: review.userId,
          foodCategory: item.foodcategory,
          foodImage: item.image[0],
          foodDescription: item.description,
          foodPrice: item.price,
          foodSeller: item.sellerid,
          rating: review.rating,
          comment: review.comment,
        }))
      );

      return response.ok(res, allReviews);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getFavoriteFoods: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      let foods = await Foods.find({ favorite:{ $in: [userId] } })
        .populate("foodcategory")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      const updatedFoods = foods.map((food) => ({
      ...food,
      isFavorite: true, // always true because of query condition
    }));

      return response.ok(res, updatedFoods);
    } catch (error) {
      return response.error(res, error);
    }
  },
};
