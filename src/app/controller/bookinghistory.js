const mongoose = require('mongoose');
const BookingHistory = mongoose.model('BookingHistory');
const response = require('../responses');

module.exports = {
  createBookingHistory: async (req, res) => {
    try {
      const payload = req?.body || {};
      payload.user = req.user.id;

      const now = new Date();
      const date = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 17);
      if (!payload.booking_ref) {
        payload.booking_ref = `BKH-${date}`;
      }

      const booking = new BookingHistory(payload);
      await booking.save();

      return response.ok(res, { message: 'Booking history saved successfully', booking });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getBookingHistoryByUser: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, booking_type, status } = req.query;

      const cond = { user: userId };
      if (booking_type) cond.booking_type = booking_type;
      if (status) cond.status = status;

      const data = await BookingHistory.find(cond)
        .populate('user_profile', 'firstName lastName image phoneNumber')
        .populate('seller_profile', 'firstName lastName image phoneNumber')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await BookingHistory.countDocuments(cond);

      return response.ok(res, { data, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getBookingHistoryById: async (req, res) => {
    try {
      const data = await BookingHistory.findById(req.params.id)
        .populate('user_profile', 'firstName lastName image phoneNumber')
        .populate('seller_profile', 'firstName lastName image phoneNumber');

      if (!data) {
        return response.badReq(res, { message: 'Booking history not found' });
      }

      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateBookingHistoryStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['Confirmed', 'Pending', 'Cancelled', 'Completed', 'Rejected'];

      if (!status || !validStatuses.includes(status)) {
        return response.badReq(res, { message: `status must be one of: ${validStatuses.join(', ')}` });
      }

      const data = await BookingHistory.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!data) {
        return response.badReq(res, { message: 'Booking history not found' });
      }

      return response.ok(res, { message: 'Status updated successfully', booking: data });
    } catch (error) {
      return response.error(res, error);
    }
  },

  dropBookingHistory: async (req, res) => {
    try {
      await BookingHistory.deleteMany({});
      return response.ok(res, { message: 'BookingHistory collection dropped successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
