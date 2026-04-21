const mongoose = require("mongoose");
const Shopping = mongoose.model("Shopping");
const response = require("../responses");

module.exports = {
  createShopping: async (req, res) => {
     try {
        
        
        const payload = req?.body || {};
//        let variants = [];
//     try {
//       variants = JSON.parse(payload.variants || '[]');
//     } catch (e) {
//       console.error("Invalid JSON in variants");
//       return response.error(res, { message: "Invalid variants format" }, 400);
//     }

//     // Reconstruct image URLs from uploaded files and original URLs
//     const fileUrls = req.files?.map(file => file.location) || [];
//     console.log('file=-=-=->',req?.files);
// // console.log('fileurls===>',fileUrls)
//     let fileCounter = 0;
//     variants = variants.map(variant => {
//       const newImages = [];

//       variant.image.forEach(img => {
//         if (img.type === 'url') {
//           newImages.push(img.url); // Keep original
//         } else if (img.type === 'file') {
//           if (fileUrls[fileCounter]) {
//             newImages.push(fileUrls[fileCounter++]); // New uploaded
//           }
//         }
//       });

//       return {
//         ...variant,
//         image: newImages,
//       };
//     });

//     payload.variants = variants;

    // Generate slug
    if (payload.name) {
      payload.slug = payload.name
        .toLowerCase()
        .trim()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
    }
        
        // console.log('Final payload:', payload);
        
        
        let product = new Shopping(payload);
        const savedProduct = await product.save();
        
        console.log('Product saved:', savedProduct._id);
        
        return response.ok(res, { 
            message: "Product added successfully",
            product: savedProduct
        });
        
    } catch (error) {
        console.error('Product creation error:', error);
        
        
        // if (error.name === 'ValidationError') {
        //     return response.error(res, {
        //         message: 'Validation failed',
        //         details: error.errors
        //     }, 400);
        // }
        
        // if (error.code === 'LIMIT_FILE_SIZE') {
        //     return response.error(res, {
        //         message: 'File size too large. Maximum 10MB allowed.'
        //     }, 400);
        // }
        
        return response.error(res, {
            message: 'Internal server error',
            error: error.message
        }, 500);
    }
  },

  getShopping: async (req, res) => {
    try {
      let data = await Shopping.find()
        .populate("shoppingcategory")
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
  getShoppingforseller: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const cond = { sellerid: req.user.id };
      if (req.query.category) {
        cond.shoppingcategory = req.query.category;
      }
      let data = await Shopping.find(cond)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getShoppingById: async (req, res) => {
    try {
      const userId = req.query.userId;
      let data = await Shopping.findById(req?.params?.id).populate("shoppingcategory seller_profile");
      // let plainData = data.toObject();
      // if (userId) {
      //     const isFavorite =
      //       Array.isArray(data.favorite) &&
      //       data.favorite.some(
      //         (favUserId) => favUserId.toString() === userId.toString()
      //       );
      //       console.log('isFavorite',isFavorite);
      //     plainData.isFavorite = isFavorite;
      // }
      // return response.ok(res, plainData);
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getShoppingbycategory: async (req, res) => {
    try {
      const userId = req.query.userId;
      const { page = 1, limit = 20 } = req.query;
      cond={ shoppingcategory: req.params.id }
if (req?.query?.store_id) {
  cond.sellerid=req.query.store_id
}
      let shoppings = await Shopping.find(cond)
        .populate("shoppingcategory seller_profile")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      // if (userId) {
      //   shoppings = shoppings.map((shopping) => {
      //     const isFavorite =
      //       Array.isArray(shopping.favorite) &&
      //       shopping.favorite.some(
      //         (favUserId) => favUserId.toString() === userId.toString()
      //       );
      //     return {
      //       ...shopping,
      //       isFavorite,
      //     };
      //   });
      // }

      return response.ok(res, shoppings);
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateShopping: async (req, res) => {
    try {
      const payload = req?.body || {};
      // if (payload.name) {
      //   payload.slug = payload.name
      //     .toLowerCase()
      //     .replace(/ /g, "-")
      //     .replace(/[^\w-]+/g, "");
      // }
      let data = await Shopping.findByIdAndUpdate(payload?.id, payload, {
        new: true,
        upsert: true,
      });
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },
  deleteShopping: async (req, res) => {
    try {
      await Shopping.findByIdAndDelete(req?.params?.id);
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  shoppingSearch: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.query.userId;
      let cond = {
        $or: [
          { name: { $regex: req.query.key, $options: "i" } },
          { categoryName: { $regex: req.query.key, $options: "i" } },
        ],
      };
      let product = await Shopping.find(cond)
      .populate("shoppingcategory seller_profile")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
           if (userId) {
        product = product.map((shopping) => {
          const isFavorite =
            Array.isArray(shopping.favorite) &&
            shopping.favorite.some(
              (favUserId) => favUserId.toString() === userId.toString()
            );
          return {
            ...shopping.toObject?.(),
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

      const shopping = await Shopping.findById(payload.shoppingid);

      if (!shopping) {
        return response.badReq(res, { message: "Shopping item not found" });
      }

      const isFavorited = shopping.favorite.includes(userId);

      let updatedShopping;

      if (isFavorited) {
        updatedShopping = await Shopping.findByIdAndUpdate(
          payload.shoppingid,
          { $pull: { favorite: userId } },
          { new: true }
        );
      } else {
        updatedShopping = await Shopping.findByIdAndUpdate(
          payload.shoppingid,
          { $addToSet: { favorite: userId } },
          { new: true }
        );
      }

      return response.ok(res, {
        message: isFavorited ? "Removed from favorites" : "Added to favorites",
        data: updatedShopping,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getfavorite: async (req, res) => {
    try {
      const userId = req.user.id;
      const favoriteShopping = await Shopping.find({
        favorite: userId,
      })
        .populate("shoppingcategory", "name image")
        .select("-favorite -createdAt -updatedAt -__v");

      if (!favoriteShopping || favoriteShopping.length === 0) {
        return response.badReq(res, { message: "No favorite shopping item found" });
      }
      return response.ok(res, favoriteShopping);
    } catch (error) {
      return response.error(res, error);
    }
  },

  addreview: async (req, res) => {
    try {
      const payload = req?.body || {};
      const userId = req.user.id;

      const shopping = await Shopping.findById(payload.shoppingid);
      if (!shopping) {
        return response.badReq(res, { message: "Shopping item not found" });
      }

      const existingReviewIndex = shopping.reviews.findIndex(
        (review) => review.userId.toString() === userId.toString()
      );

      if (existingReviewIndex !== -1) {
        shopping.reviews[existingReviewIndex].rating = payload.rating;
        shopping.reviews[existingReviewIndex].comment = payload.comment;
      } else {
        shopping.reviews.push({
          userId,
          userProfile:payload?.userProfile,
          rating: payload.rating,
          comment: payload.comment,
        });
      }

      await shopping.save();

      return response.ok(res, { message: "Review submitted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getreview: async (req, res) => {
    try {
      const shopping = await Shopping.findById(req.params.id)
        .populate("shoppingcategory", "name image")
        .select("-favorite -createdAt -updatedAt -__v");

      if (!shopping) {
        return response.badReq(res, { message: "Shopping item not found" });
      }

      return response.ok(res, {
        reviews: shopping.reviews,
        averageRating:
          shopping.reviews.reduce((acc, review) => acc + review.rating, 0) /
          (shopping.reviews.length || 1),
        totalReviews: shopping.reviews.length,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getreviewByseller: async (req, res) => {
    try {
      const userId = req.user.id;

      const shoppingItems = await Shopping.find({ sellerid: userId })
        .populate("shoppingcategory", "name image")
        .populate("reviews.userProfile")
        .select("-favorite -updatedAt -__v");

      if (!shoppingItems || shoppingItems.length === 0) {
        return response.badReq(res, {
          message: "No shopping found for this seller",
        });
      }

      const userReviews = [];

      shoppingItems.forEach((shopping) => {
        shopping.reviews.forEach((review) => {
          userReviews.push({
            shoppingId: shopping._id,
            shoppingName: shopping.name,
            shoppingCategory: shopping.shoppingcategory,
            shoppingImage: shopping.image[0] || null,
            shoppingDescription: shopping.description,
            shoppingPrice: shopping.price,
            shoppingSeller: shopping.sellerid,
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
      const shopping = await Shopping.find()
        .populate("shoppingcategory", "name image")
        .populate("reviews.userId", "username")
        .populate("sellerid", "username")
        .select("-favorite -createdAt -updatedAt -__v");

      if (!shopping || shopping.length === 0) {
        return response.badReq(res, { message: "No reviews found" });
      }

      const allReviews = shopping.flatMap((item) =>
        item.reviews.map((review) => ({
          shoppingId: item._id,
          shoppingName: item.name,
          user: review.userId,
          shoppingCategory: item.shoppingcategory,
          shoppingImage: item.image[0],
          shoppingDescription: item.description,
          shoppingPrice: item.price,
          shoppingSeller: item.sellerid,
          rating: review.rating,
          comment: review.comment,
        }))
      );

      return response.ok(res, allReviews);
    } catch (error) {
      return response.error(res, error);
    }
  },
    getTopSoldShopping: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      // const products = await Product.find({ sold_pieces: { $gte: 1 } }) // Only products with at least 1 sold
      const products = await Shopping.find()
      .populate("shoppingcategory seller_profile")
        .sort({ sold_pieces: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, products);
    } catch (error) {
      return response.error(res, error);
    }
  },
};
