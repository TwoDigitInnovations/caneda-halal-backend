const mongoose = require("mongoose");
const Grocery = mongoose.model("Grocery");
const response = require("../responses");

const withRatingFields = (items, userId = null) =>
  items.map(item => {
    const plain = item.toObject ? item.toObject() : item;
    const reviews = Array.isArray(plain.reviews) ? plain.reviews : [];
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1)
      : null;
    const isFavorite = userId
      ? Array.isArray(plain.favorite) && plain.favorite.some(id => id.toString() === userId.toString())
      : false;
    const { reviews: _r, favorite: _f, ...rest } = plain;
    return { ...rest, averageRating, totalReviews, isFavorite };
  });

module.exports = {
  createGrocery: async (req, res) => {
    try {
      const payload = req?.body || {};
      // payload.slug = payload.name
      //   .toLowerCase()
      //   .replace(/ /g, "-")
      //   .replace(/[^\w-]+/g, "");
      let cat = new Grocery(payload);
      await cat.save();
      return response.ok(res, { message: "Grocery item create successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getGroceryforseller: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const cond = { sellerid: req.user.id };
      if (req.query.category) {
        cond.grocerycategory = req.query.category;
      }
      let data = await Grocery.find(cond)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getGroceryById: async (req, res) => {
    try {
      const userId = req.query.userId;
      let data = await Grocery.findById(req?.params?.id).populate("grocerycategory seller_profile").lean();
      let plainData = data;

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
  getGrocerybycategory: async (req, res) => {
    try {
      const userId = req.query.userId;
      const { page = 1, limit = 20 } = req.query;

      cond={ grocerycategory: req.params.id,expirydate: { $gte: new Date() } }
if (req?.query?.store_id) {
  cond.sellerid=req.query.store_id
}
      let grocerys = await Grocery.find(cond)
        .populate("grocerycategory seller_profile")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      return response.ok(res, withRatingFields(grocerys, userId));
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateGrocery: async (req, res) => {
    try {
      const payload = req?.body || {};
      // if (payload.name) {
      //   payload.slug = payload.name
      //     .toLowerCase()
      //     .replace(/ /g, "-")
      //     .replace(/[^\w-]+/g, "");
      // }
      let data = await Grocery.findByIdAndUpdate(payload?.id, payload, {
        new: true,
        upsert: true,
      });
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  deleteGrocery: async (req, res) => {
    try {
      await Grocery.findByIdAndDelete(req?.params?.id);
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  grocerySearch: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.query.userId;
      let cond = {
        $or: [
          { name: { $regex: req.query.key, $options: "i" } },
          { categoryName: { $regex: req.query.key, $options: "i" } },
        ],
        expirydate: { $gte: new Date() }
      };
      let product = await Grocery.find(cond)
        .populate("grocerycategory seller_profile")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, withRatingFields(product, req.user?.id));
    } catch (error) {
      return response.error(res, error);
    }
  },

  togglefavorite: async (req, res) => {
    try {
      const payload = req?.body || {};
      const userId = req.user.id;

      const grocery = await Grocery.findById(payload.groceryid);

      if (!grocery) {
        return response.badReq(res, { message: "Grocery item not found" });
      }

      const isFavorited = grocery.favorite.includes(userId);

      let updatedGrocery;

      if (isFavorited) {
        updatedGrocery = await Grocery.findByIdAndUpdate(
          payload.groceryid,
          { $pull: { favorite: userId } },
          { new: true }
        );
      } else {
        updatedGrocery = await Grocery.findByIdAndUpdate(
          payload.groceryid,
          { $addToSet: { favorite: userId } },
          { new: true }
        );
      }

      return response.ok(res, {
        message: isFavorited ? "Removed from favorites" : "Added to favorites",
        data: updatedGrocery,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getfavorite: async (req, res) => {
    try {
      const userId = req.user.id;
      const favoriteGrocery = await Grocery.find({
        favorite: userId,
      })
        .populate("grocerycategory", "name image")
        .select("-createdAt -updatedAt -__v");

      return response.ok(res, withRatingFields(favoriteGrocery, userId));
    } catch (error) {
      return response.error(res, error);
    }
  },

  addreview: async (req, res) => {
    try {
      const payload = req?.body || {};
      const userId = req.user.id;

      const grocery = await Grocery.findById(payload.groceryid);
      if (!grocery) {
        return response.badReq(res, { message: "Grocery item not found" });
      }

      const existingReviewIndex = grocery.reviews.findIndex(
        (review) => review.userId.toString() === userId.toString()
      );

      if (existingReviewIndex !== -1) {
        grocery.reviews[existingReviewIndex].rating = payload.rating;
        grocery.reviews[existingReviewIndex].comment = payload.comment;
      } else {
        grocery.reviews.push({
          userId,
          userProfile:payload?.userProfile,
          rating: payload.rating,
          comment: payload.comment,
        });
      }

      await grocery.save();

      return response.ok(res, { message: "Review submitted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getreview: async (req, res) => {
    try {
      const grocery = await Grocery.findById(req.params.id)
        .populate("grocerycategory", "name image")
        .select("-favorite -createdAt -updatedAt -__v");

      if (!grocery) {
        return response.badReq(res, { message: "Grocery item not found" });
      }

      return response.ok(res, {
        reviews: grocery.reviews,
        averageRating:
          grocery.reviews.reduce((acc, review) => acc + review.rating, 0) /
          (grocery.reviews.length || 1),
        totalReviews: grocery.reviews.length,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getreviewByseller: async (req, res) => {
    try {
      const userId = req.user.id;

      const groceryItems = await Grocery.find({ sellerid: userId })
        .populate("grocerycategory", "name image")
        .populate("reviews.userProfile")
        .select("-favorite -updatedAt -__v");

      if (!groceryItems || groceryItems.length === 0) {
        return response.badReq(res, {
          message: "No grocery found for this seller",
        });
      }

      const userReviews = [];

      groceryItems.forEach((grocery) => {
        grocery.reviews.forEach((review) => {
          userReviews.push({
            groceryId: grocery._id,
            groceryName: grocery.name,
            groceryCategory: grocery.grocerycategory,
            groceryImage: grocery.image[0] || null,
            groceryDescription: grocery.description,
            groceryPrice: grocery.price,
            grocerySeller: grocery.sellerid,
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
      const grocery = await Grocery.find()
        .populate("grocerycategory", "name image")
        .populate("reviews.userId", "username")
        .populate("sellerid", "username")
        .select("-favorite -createdAt -updatedAt -__v");

      if (!grocery || grocery.length === 0) {
        return response.badReq(res, { message: "No reviews found" });
      }

      const allReviews = grocery.flatMap((item) =>
        item.reviews.map((review) => ({
          groceryId: item._id,
          groceryName: item.name,
          user: review.userId,
          groceryCategory: item.grocerycategory,
          groceryImage: item.image[0],
          groceryDescription: item.description,
          groceryPrice: item.price,
          grocerySeller: item.sellerid,
          rating: review.rating,
          comment: review.comment,
        }))
      );

      return response.ok(res, allReviews);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getTopGroceryBySeller: async (req, res) => {
    try {
      const {sellerId} = req.params;
      const {limit = 10, excludeIds, userId} = req.query;

      const cond = {
        sellerid: mongoose.Types.ObjectId.isValid(sellerId)
          ? new mongoose.Types.ObjectId(sellerId)
          : sellerId,
        expirydate: {$gte: new Date()},
      };

      if (excludeIds) {
        const ids = excludeIds
          .split(',')
          .map(id => id.trim())
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        if (ids.length > 0) cond._id = {$nin: ids};
      }

      const products = await Grocery.find(cond)
        .populate('grocerycategory seller_profile')
        .sort({sold_pieces: -1})
        .limit(parseInt(limit));

      return response.ok(res, withRatingFields(products, userId));
    } catch (error) {
      return response.error(res, error);
    }
  },

  getTopSoldGrocery: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.query.userId;
      const products = await Grocery.find({expirydate: { $gte: new Date() }})
        .populate("grocerycategory seller_profile")
        .sort({ sold_pieces: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, withRatingFields(products, userId));
    } catch (error) {
      return response.error(res, error);
    }
  },
};
