'use strict';

const axios = require('axios');
const mongoose = require('mongoose');
const response = require('../responses');
const { notify } = require('../services/notification');

const FLIGHT_API_BASE = 'https://api.adivaha.io/flights/api/';
const FLIGHT_API_HEADERS = {
  'Accept': 'application/json',
  'Accept-Encoding': 'gzip',
  'PID': process.env.ADIVAHA_API_PID || 'CanedaHalalBackend',
  'x-api-key':process.env.ADIVAHA_API_KEY || 'your_api_key',
};

const flightGet = (params) =>
  axios.get(FLIGHT_API_BASE, { headers: FLIGHT_API_HEADERS, params, decompress: true });

const flightPost = (params, body) =>
  axios.post(FLIGHT_API_BASE, body, {
    headers: { ...FLIGHT_API_HEADERS, 'Content-Type': 'application/json' },
    params,
    decompress: true,
  });

// Adivaha returns HTTP 200 even for errors — handle both response shapes:
//   { Status: 7605, status_message: "..." }  (numeric error code)
//   { status: false, message: "..." }         (boolean false)
const handleApiResponse = (res, data) => {
  if (!data) return response.error(res, 'Empty response from flight API');

  const isNumericError = data.Status !== undefined && data.Status !== 1;
  const isBooleanError = data.status === false;

  if (isNumericError || isBooleanError) {
    const message = data.status_message || data.message || 'Third party API error';
    const code = data.Status || null;
    return response.error(res, { ...(code && { Status: code }), message });
  }

  return response.ok(res, data);
};

async function saveFlightBookingHistory(userId, reqBody, FlightapiData) {
  // FlightapiData = data.responseData  (the wrapper object with TraceId + Response)
  // apiData       = data.responseData.Response  (the actual booking payload)
  const apiData = FlightapiData.Response || FlightapiData;

  try {
    const BookingHistory = mongoose.model('BookingHistory');

    const itinerary = apiData.FlightItinerary || {};
    const fare = itinerary.Fare || {};
    const rawSegments = itinerary.Segments || [];
    const segments = rawSegments.flat ? rawSegments.flat() : rawSegments;

    const pnr = apiData.PNR || itinerary.PNR;
    const bookingId = apiData.BookingId || itinerary.BookingId;

    const items = segments.map(seg => ({
      name:
        [seg.Origin?.Airport?.AirportCode, seg.Destination?.Airport?.AirportCode]
          .filter(Boolean)
          .join(' → ') +
        (seg.Airline?.AirlineName
          ? ` (${seg.Airline.AirlineName} ${seg.Airline.FlightNumber || ''})`.trimEnd()
          : ''),
      qty: 1,
      price: fare.BaseFare || null,
    }));

    const passengerNote = Array.isArray(reqBody.Passengers)
      ? reqBody.Passengers.map(p => `${p.FirstName} ${p.LastName}`).join(', ')
      : null;

    const generatedOrderId = FlightapiData.order_id
      || apiData.order_id
      || (bookingId ? `BK-${bookingId}` : undefined);

    const booking = new BookingHistory({
      TraceId: FlightapiData.TraceId || apiData.TraceId,
      order_id: generatedOrderId,
      user: userId,
      booking_type: 'FLIGHT',
      booking_ref: pnr || (bookingId ? `BK-${bookingId}` : undefined),
      items: items.length ? items : undefined,
      status: 'Confirmed',
      total_amount: fare.PublishedFare || null,
      tax: fare.Tax || null,
      final_amount: fare.OfferedFare || fare.PublishedFare || null,
      paymentmode: reqBody.paymentmode || null,
      paymentid: reqBody.paymentid || null,
      notes: passengerNote,
      flight_data: {
        ItineraryChangeList: apiData.ItineraryChangeList ?? null,
        PNR: apiData.PNR,
        BookingId: apiData.BookingId,
        SSRDenied: apiData.SSRDenied,
        SSRMessage: apiData.SSRMessage ?? null,
        Status: apiData.Status,
        IsPriceChanged: apiData.IsPriceChanged,
        IsTimeChanged: apiData.IsTimeChanged,
        TicketStatus: apiData.TicketStatus,
        FlightItinerary: itinerary,
      },
    });

    await booking.save();
  } catch (err) {
    console.error('Failed to save flight booking history:', err.message);
  }
}

module.exports = {
  // GET /flight/locations?term=del&limit=5
  flightLocations: async (req, res) => {
    try {
      const { term, limit = 5 } = req.query;
      if (!term) return response.badReq(res, 'term is required');
      const { data } = await flightGet({ action: 'flightLocations', term, limit });
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /flight/search
  // body: { adults, children, infants, isoneway, From_IATACODE, To_IATACODE, departure_date, return_date, Flights_category }
  searchFlight: async (req, res) => {
    try {
      const {
        adults = '1',
        children = '0',
        infants = '0',
        isoneway = 'Yes',
        From_IATACODE,
        To_IATACODE,
        departure_date,
        return_date,
        Flights_category = 'Economy',
      } = req.body;

      if (!From_IATACODE || !To_IATACODE || !departure_date) {
        return response.badReq(res, 'From_IATACODE, To_IATACODE and departure_date are required');
      }

      const { data } = await flightPost(
        { action: 'searchFlights' },
        { action: 'flightSearch', adults, children, infants, isoneway, From_IATACODE, To_IATACODE, departure_date, return_date, Flights_category }
      );

      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /flight/multicity-search
  // body: { adults, children, infants, Segments: [{ Origin, Destination, FlightCabinClass, PreferredDepartureTime, PreferredArrivalTime }] }
  multiCitySearch: async (req, res) => {
    try {
      const { adults = 1, children = 0, infants = 0, Segments } = req.body;

      if (!Segments || !Array.isArray(Segments) || Segments.length === 0) {
        return response.badReq(res, 'Segments array is required');
      }

      for (const seg of Segments) {
        if (!seg.Origin || !seg.Destination || !seg.PreferredDepartureTime) {
          return response.badReq(res, 'Each segment must have Origin, Destination and PreferredDepartureTime');
        }
      }

      const { data } = await flightPost(
        { action: 'multicityflightSearch' },
        { action: 'multicityflightSearch', adults, children, infants, Segments }
      );

      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /flight/fare-quote
  // body: { ResultIndex, TraceId }
  fareQuote: async (req, res) => {
    try {
      const { ResultIndex, TraceId } = req.body;
      if (!ResultIndex) return response.badReq(res, 'ResultIndex is required');
      if (!TraceId) return response.badReq(res, 'TraceId is required');
      const { data } = await flightPost(
        { action: 'fareQuote' },
        { action: 'fareQuote', ResultIndex, TraceId }
      );
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // GET /flight/fare-rules?resultIndex=&traceId=
  fareRules: async (req, res) => {
    try {
      const { resultIndex, traceId } = req.query;
      if (!resultIndex || !traceId) return response.badReq(res, 'resultIndex and traceId are required');
      const { data } = await flightGet({ action: 'fareRules', resultIndex, traceId });
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // GET /flight/seat-map?resultIndex=&traceId=
  seatMap: async (req, res) => {
    try {
      const { resultIndex, traceId } = req.query;
      if (!resultIndex || !traceId) return response.badReq(res, 'resultIndex and traceId are required');
      const { data } = await flightGet({ action: 'seatMap', resultIndex, traceId });
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /flight/book
  // body: { ResultIndex, TraceId, IsLCC, isoneway, isDomestic, IsDomesticReturn, Passengers: [...], paymentmode, paymentid }
  // IsLCC "1" → ticketForLcc (budget carriers), IsLCC "0" → flightBook (full-service carriers)
  bookFlight: async (req, res) => {
    try {
      const {
        ResultIndex,
        TraceId,
        IsLCC = '0',
        isoneway = 'Yes',
        isDomestic = 'Yes',
        IsDomesticReturn = 'Yes',
        Passengers,
        paymentmode,
        paymentid,
      } = req.body;

      if (!ResultIndex) return response.badReq(res, 'ResultIndex is required');
      if (!TraceId) return response.badReq(res, 'TraceId is required');
      if (!Passengers || !Array.isArray(Passengers) || Passengers.length === 0) {
        return response.badReq(res, 'Passengers array is required');
      }

      for (const pax of Passengers) {
        if (!pax.FirstName || !pax.LastName || !pax.PaxType || !pax.ContactNo || !pax.Email) {
          return response.badReq(res, 'Each passenger must have FirstName, LastName, PaxType, ContactNo and Email');
        }
      }

      const action = IsLCC === '1' ? 'ticketForLcc' : 'flightBook';

      const { data } = await flightPost(
        { action },
        { action, ResultIndex, TraceId, IsLCC, isoneway, isDomestic, IsDomesticReturn, Passengers }
      );
console.log(data)
      // Auto-save booking history on successful response
      const isSuccess = data.responseData.Response.Error.ErrorCode === 0;
      console.log(isSuccess)
      if (isSuccess && req.user) {
        const itinerary = data.responseData.Response.Response.FlightItinerary || {};
        const segments = (itinerary.Segments || []).flat();
        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];
        const origin = firstSeg?.Origin?.Airport?.AirportCode || itinerary.Origin || '';
        const destination = lastSeg?.Destination?.Airport?.AirportCode || itinerary.Destination || '';
        const bookingId = itinerary.BookingId || data.responseData.Response.BookingId || '';
        const pnr = itinerary.PNR || data.responseData.Response.PNR || '';

        const notifTitle = 'Booking Confirmed';
        const notifBody = `Your flight ${origin} → ${destination} is confirmed.${bookingId ? ` Booking ID: ${bookingId}.` : ''}${pnr ? ` PNR: ${pnr}.` : ''}`;

        saveFlightBookingHistory(req.user.id, { Passengers, paymentmode, paymentid }, data.responseData).catch(() => {});
        notify([req.user.id], notifTitle, notifBody, 'FLIGHT').catch(() => {});
      }

      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // GET /flight/booking?bookingId=
  getBookingDetails: async (req, res) => {
    try {
      const { bookingId } = req.query;
      if (!bookingId) return response.badReq(res, 'bookingId is required');
      const { data } = await flightGet({ action: 'getBookingDetails', bookingId });
      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /flight/cancellation-charges
  // body: { BookingId, RequestType }
  getCancellationCharges: async (req, res) => {
    try {
      const { BookingId, RequestType = '1' } = req.body;
      if (!BookingId) return response.badReq(res, 'BookingId is required');

      const { data } = await flightPost(
        { action: 'getCancellationCharges' },
        { action: 'getCancellationCharges', BookingId, RequestType }
      );

      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },

  // POST /flight/cancel
  // body: { order_id, BookingId, RequestType, CancellationType, Sectors, TicketId, Remarks, EndUserIp }
  cancelBooking: async (req, res) => {
    try {
      const {
        order_id,
        BookingId,
        RequestType = 0,
        CancellationType = 0,
        Sectors,
        TicketId,
        Remarks = '',
        EndUserIp,
      } = req.body;

      if (!BookingId) return response.badReq(res, 'BookingId is required');
      if (!Array.isArray(TicketId)) return response.badReq(res, 'TicketId must be an array');
      if (!Array.isArray(Sectors) || Sectors.length === 0) return response.badReq(res, 'Sectors array is required');

      const effectiveOrderId = order_id || `BK-${BookingId}`;

      const { data } = await flightPost(
        { action: 'ticketCancel' },
        {
          action: 'ticketCancel',
          order_id: effectiveOrderId,
          ChangeRequestData: {
            BookingId,
            RequestType,
            CancellationType,
            Sectors,
            TicketId,
            Remarks,
            EndUserIp,
          },
        }
      );

      const isSuccess = data.responseData?.Response?.ResponseStatus === 1;
      console.log(isSuccess , req.user)
      if (isSuccess && req.user) {
        const BookingHistory = mongoose.model('BookingHistory');
      const newHistory =  BookingHistory.findOneAndUpdate(
          { 'flight_data.BookingId': BookingId },
          { status: 'Cancelled' },
          {new:true, upsert:true}
        ).catch(() => {});

console.log(newHistory)

        const notifTitle = 'Booking Cancelled';
        const notifBody = `Your flight booking (ID: ${BookingId}) has been successfully cancelled. Refund will be processed as per airline policy.`;
        notify([req.user.id], notifTitle, notifBody, 'FLIGHT').catch(() => {});
      }

      return handleApiResponse(res, data);
    } catch (err) {
      return response.error(res, err?.response?.data || err.message);
    }
  },
};
