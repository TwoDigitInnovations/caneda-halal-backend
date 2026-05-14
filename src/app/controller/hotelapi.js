'use strict';

const axios = require('axios');
const mongoose = require('mongoose');
const response = require('../responses');
const { notify } = require('../services/notification');

const HOTEL_API_BASE = 'https://api.adivaha.io/hotel-booking/api/';
const HOTEL_API_HEADERS = {
  'Accept': 'application/json',
  'Accept-Encoding': 'gzip',
  'PID': process.env.ADIVAHA_API_PID || 'CanedaHalalBackend',
  'x-api-key': process.env.ADIVAHA_API_KEY || 'your_api_key',
};

const hotelGet = (params) =>
  axios.get(HOTEL_API_BASE, { headers: HOTEL_API_HEADERS, params, decompress: true });

const hotelPost = (params, body) =>
  axios.post(HOTEL_API_BASE, body, {
    headers: { ...HOTEL_API_HEADERS, 'Content-Type': 'application/json' },
    params,
    decompress: true,
  });

const handleApiResponse = (res, data) => {
  if (!data) return response.error(res, 'Empty response from hotel API');
  if (data.status === false) {
    return response.error(res, data.message || 'Third party API error');
  }
  return response.ok(res, data);
};

async function saveHotelBookingHistory(userId, reqBody, apiData) {
  try {
    const BookingHistory = mongoose.model('BookingHistory');
    const booking_reference = apiData?.booking_reference || apiData?.bookingReference || '';
    const order_id = apiData?.order_id || (booking_reference ? `HB-${booking_reference}` : undefined);

    const booking = new BookingHistory({
      order_id,
      user: userId,
      booking_type: 'HOTEL',
      booking_ref: booking_reference,
      items: [{
        name: reqBody.hotelName || 'Hotel Booking',
        qty: reqBody.rooms?.length || 1,
        price: reqBody.chargablePrice || null,
      }],
      status: 'Confirmed',
      total_amount: reqBody.chargablePrice || null,
      final_amount: reqBody.chargablePrice || null,
      paymentmode: reqBody.paymentmode || null,
      paymentid: reqBody.paymentid || null,
      notes: reqBody.holder ? `${reqBody.holder.name} ${reqBody.holder.surname}` : null,
      hotel_data: {
        booking_reference,
        holder: reqBody.holder,
        rooms: reqBody.rooms,
        checkIn: reqBody.checkIn,
        checkOut: reqBody.checkOut,
        apiResponse: apiData,
      },
    });

    await booking.save();
    return booking;
  } catch (err) {
    console.error('Failed to save hotel booking history:', err.message);
  }
}

module.exports = {
  // GET /hotel/locations?term=del&limit=5
  hotelLocations: async (req, res) => {
    try {
      const { term, limit = 5 } = req.query;
      if (!term) return response.badReq(res, 'term is required');
      const { data } = await hotelGet({ action: 'getLocations', term, limit });
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /hotel/search
  // body: { regionid, countryCode, checkIn, checkOut, rooms, adults, children, childAge, page }
  hotelSearch: async (req, res) => {
    try {
      const {
        regionid,
        countryCode = 'IN',
        checkIn,
        checkOut,
        rooms = 1,
        adults = '1',
        children = '0',
        childAge = '0',
        page = 1,
      } = req.body;

      if (!regionid || !checkIn || !checkOut) {
        return response.badReq(res, 'regionid, checkIn and checkOut are required');
      }

      const { data } = await hotelPost(
        { action: 'hotelSearch' },
        { action: 'hotelSearch', regionid, countryCode, checkIn, checkOut, rooms, adults, children, childAge, page }
      );
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /hotel/description
  // body: { hotelId }
  hotelDescription: async (req, res) => {
    try {
      const { hotelId } = req.body;
      if (!hotelId) return response.badReq(res, 'hotelId is required');
      const { data } = await hotelPost(
        { action: 'hotelDetailsBycode' },
        { action: 'hotelDetailsBycode', hotelId }
      );
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /hotel/room-availability
  // body: { hotelId, checkIn, checkOut, rooms, adults, children, childAge }
  roomAvailability: async (req, res) => {
    try {
      const {
        hotelId,
        checkIn,
        checkOut,
        rooms = '1',
        adults = '1',
        children = '0',
        childAge = '0',
      } = req.body;

      if (!hotelId || !checkIn || !checkOut) {
        return response.badReq(res, 'hotelId, checkIn and checkOut are required');
      }

      const { data } = await hotelPost(
        { action: 'roomAvalibility' },
        { action: 'roomAvalibility', hotelId, checkIn, checkOut, rooms, adults, children, childAge }
      );
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /hotel/check-rate
  // body: { rateKey }
  checkRate: async (req, res) => {
    try {
      const { rateKey } = req.body;
      if (!rateKey) return response.badReq(res, 'rateKey is required');
      const { data } = await hotelPost(
        { action: 'CheckRates' },
        { action: 'CheckRates', rateKey }
      );
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /hotel/book
  // body: { holder: {name, surname}, rooms: [{rateKey, paxes}], isTolerance, chargablePrice, currency }
  bookHotel: async (req, res) => {
    try {
      const {
        holder,
        rooms,
        isTolerance = 'Yes',
        chargablePrice,
        currency = 'INR',
        paymentmode,
        paymentid,
        checkIn,
        checkOut,
        hotelName,
      } = req.body;

      if (!holder || !holder.name || !holder.surname) {
        return response.badReq(res, 'holder.name and holder.surname are required');
      }
      if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
        return response.badReq(res, 'rooms array is required');
      }
      for (const room of rooms) {
        if (!room.rateKey) return response.badReq(res, 'Each room must have a rateKey');
        if (!Array.isArray(room.paxes) || room.paxes.length === 0) {
          return response.badReq(res, 'Each room must have at least one pax');
        }
      }

      const { data } = await hotelPost(
        { action: 'bookHotel' },
        { action: 'bookHotel', holder, rooms, isTolerance, chargablePrice, currency }
      );

      if (data?.status !== false && req.user) {
        const apiData = data?.data || data;
        saveHotelBookingHistory(
          req.user.id,
          { holder, rooms, chargablePrice, currency, paymentmode, paymentid, checkIn, checkOut, hotelName },
          apiData,
        ).catch(() => {});

        const notifTitle = 'Hotel Booking Confirmed';
        const notifBody = `Your hotel booking for ${holder.name} ${holder.surname} has been confirmed.`;
        notify([req.user.id], notifTitle, notifBody, 'HOTEL').catch(() => {});
      }

      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /hotel/booking-detail
  // body: { booking_reference, order_id }
  getBookingDetail: async (req, res) => {
    try {
      const { booking_reference, order_id } = req.body;
      if (!booking_reference && !order_id) {
        return response.badReq(res, 'booking_reference or order_id is required');
      }
      const { data } = await hotelPost(
        { action: 'bookingDetail' },
        { action: 'bookingDetail', booking_reference, order_id }
      );
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /hotel/cancel
  // body: { order_id, booking_reference, reason }
  cancelBooking: async (req, res) => {
    try {
      const { order_id, booking_reference, reason = 'others' } = req.body;
      if (!booking_reference) return response.badReq(res, 'booking_reference is required');

      const { data } = await hotelPost(
        { action: 'cancelBooking' },
        { action: 'cancelBooking', order_id, booking_reference, reason }
      );

      if (data?.status !== false && req.user) {
        const BookingHistory = mongoose.model('BookingHistory');
        BookingHistory.findOneAndUpdate(
          { 'hotel_data.booking_reference': booking_reference },
          { status: 'Cancelled' },
        ).catch(() => {});

        notify(
          [req.user.id],
          'Hotel Booking Cancelled',
          `Your hotel booking (Ref: ${booking_reference}) has been cancelled.`,
          'HOTEL',
        ).catch(() => {});
      }

      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },
};
