'use strict';

const mongoose = require('mongoose');

const bookingItemSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  name: {
    type: String,
  },
  image: {
    type: String,
  },
  qty: {
    type: Number,
  },
  price: {
    type: Number,
  },
});

const bookinghistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user_profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
    },
    booking_type: {
      type: String,
      enum: ['FOOD', 'GROCERY', 'SHOPPING', 'FLIGHT', 'RIDE'],
      required: true,
    },
    booking_ref: {
      type: String,
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    items: [bookingItemSchema],
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    seller_profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
    },
    status: {
      type: String,
      default: 'Confirmed',
      enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed', 'Rejected'],
    },
    total_amount: {
      type: Number,
    },
    tax: {
      type: Number,
    },
    discount: {
      type: Number,
    },
    delivery_fee: {
      type: Number,
    },
    final_amount: {
      type: Number,
    },
    paymentmode: {
      type: String,
    },
    paymentid: {
      type: String,
    },
    delivery_address: {
      type: Object,
    },
    notes: {
      type: String,
    },
     TraceId: {
      type: String,
    },
    order_id: {
      type: String,
    },
    flight_data: {
      ItineraryChangeList: { type: mongoose.Schema.Types.Mixed, default: null },
      PNR: { type: String },
      BookingId: { type: Number },
      SSRDenied: { type: Boolean },
      SSRMessage: { type: mongoose.Schema.Types.Mixed, default: null },
      Status: { type: Number },
      IsPriceChanged: { type: Boolean },
      IsTimeChanged: { type: Boolean },
      TicketStatus: { type: Number },
      FlightItinerary: {
        CommentDetails: { type: mongoose.Schema.Types.Mixed, default: null },
        FareClassification: { type: String },
        IsAutoReissuanceAllowed: { type: Boolean },
        IsPartialVoidAllowed: { type: Boolean },
        IsSeatsBooked: { type: Boolean },
        IssuancePcc: { type: String },
        JourneyType: { type: Number },
        SearchCombinationType: { type: Number },
        SupplierFareClasses: { type: String },
        TBOConfNo: { type: String },
        TBOTripID: { type: mongoose.Schema.Types.Mixed, default: null },
        TripIndicator: { type: Number },
        BookingAllowedForRoamer: { type: Boolean },
        BookingId: { type: Number },
        IsCouponAppilcable: { type: Boolean },
        IsManual: { type: Boolean },
        PNR: { type: String },
        IsDomestic: { type: Boolean },
        ResultFareType: { type: String },
        Source: { type: Number },
        Origin: { type: String },
        Destination: { type: String },
        AirlineCode: { type: String },
        ValidatingAirlineCode: { type: String },
        AirlineRemark: { type: String },
        IsLCC: { type: Boolean },
        NonRefundable: { type: Boolean },
        FareType: { type: String },
        CreditNoteNo: { type: mongoose.Schema.Types.Mixed, default: null },
        Fare: { type: mongoose.Schema.Types.Mixed },
        CreditNoteCreatedOn: { type: mongoose.Schema.Types.Mixed, default: null },
        Passenger: { type: [mongoose.Schema.Types.Mixed], default: [] },
        CancellationCharges: { type: mongoose.Schema.Types.Mixed, default: null },
        Segments: { type: [mongoose.Schema.Types.Mixed], default: [] },
        FareRules: { type: [mongoose.Schema.Types.Mixed], default: [] },
        PenaltyCharges: { type: [mongoose.Schema.Types.Mixed], default: [] },
        Status: { type: Number },
        Invoice: { type: [mongoose.Schema.Types.Mixed], default: [] },
        InvoiceAmount: { type: Number },
        InvoiceNo: { type: String },
        InvoiceStatus: { type: Number },
        InvoiceCreatedOn: { type: Date },
        Remarks: { type: String },
        IsWebCheckInAllowed: { type: Boolean },
      },
    },
  },
  {
    timestamps: true,
  }
);

bookinghistorySchema.set('toJSON', {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('BookingHistory', bookinghistorySchema);
