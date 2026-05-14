'use strict';

const mongoose = require('mongoose');
const response = require('../responses');

const REQUIRED_FIELDS = ['FirstName', 'LastName'];

function validatePassenger(body) {
  for (const f of REQUIRED_FIELDS) {
    if (!body[f] || !String(body[f]).trim()) return `${f} is required`;
  }
  if (body.PaxType !== undefined && ![1, 2, 3].includes(Number(body.PaxType))) {
    return 'PaxType must be 1 (Adult), 2 (Child), or 3 (Infant)';
  }
  if (body.Gender !== undefined && ![1, 2].includes(Number(body.Gender))) {
    return 'Gender must be 1 (Male) or 2 (Female)';
  }
  if (body.Email && !/\S+@\S+\.\S+/.test(body.Email)) {
    return 'Invalid email address';
  }
  return null;
}

module.exports = {
  // GET /passengers
  getPassengers: async (req, res) => {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(req.user.id).select('passengers');
      if (!user) return response.notFound(res, 'User not found');
      return response.ok(res, { passengers: user.passengers });
    } catch (err) {
      return response.error(res, err.message);
    }
  },

  // POST /passengers
  addPassenger: async (req, res) => {
    try {
      const error = validatePassenger(req.body);
      if (error) return response.badReq(res, error);

      const {
        Title, FirstName, LastName, PaxType, DateOfBirth, Gender,
        PassportNo, PassportExpiry, AddressLine1, AddressLine2,
        City, CountryCode, CountryName, Nationality, ContactNo, Email, IsLeadPax,
      } = req.body;

      const User = mongoose.model('User');
      const user = await User.findById(req.user.id);
      if (!user) return response.notFound(res, 'User not found');

      // Only one lead passenger allowed
      if (IsLeadPax) {
        user.passengers.forEach(p => { p.IsLeadPax = false; });
      }

      user.passengers.push({
        Title, FirstName: FirstName.trim(), LastName: LastName.trim(),
        PaxType: PaxType !== undefined ? Number(PaxType) : 1,
        DateOfBirth, Gender: Gender !== undefined ? Number(Gender) : 1,
        PassportNo, PassportExpiry, AddressLine1, AddressLine2,
        City, CountryCode, CountryName, Nationality,
        ContactNo, Email, IsLeadPax: !!IsLeadPax,
      });

      await user.save();
      const added = user.passengers[user.passengers.length - 1];
      return response.ok(res, { passenger: added });
    } catch (err) {
      return response.error(res, err.message);
    }
  },

  // PUT /passengers/:passengerId
  updatePassenger: async (req, res) => {
    try {
      const { passengerId } = req.params;

      const User = mongoose.model('User');
      const user = await User.findById(req.user.id);
      if (!user) return response.notFound(res, 'User not found');

      const passenger = user.passengers.id(passengerId);
      if (!passenger) return response.notFound(res, 'Passenger not found');

      const {
        Title, FirstName, LastName, PaxType, DateOfBirth, Gender,
        PassportNo, PassportExpiry, AddressLine1, AddressLine2,
        City, CountryCode, CountryName, Nationality, ContactNo, Email, IsLeadPax,
      } = req.body;

      if (FirstName !== undefined && !String(FirstName).trim()) return response.badReq(res, 'FirstName cannot be empty');
      if (LastName !== undefined && !String(LastName).trim()) return response.badReq(res, 'LastName cannot be empty');
      if (Email !== undefined && Email && !/\S+@\S+\.\S+/.test(Email)) return response.badReq(res, 'Invalid email address');

      if (IsLeadPax) {
        user.passengers.forEach(p => { p.IsLeadPax = false; });
      }

      if (Title !== undefined) passenger.Title = Title;
      if (FirstName !== undefined) passenger.FirstName = String(FirstName).trim();
      if (LastName !== undefined) passenger.LastName = String(LastName).trim();
      if (PaxType !== undefined) passenger.PaxType = Number(PaxType);
      if (DateOfBirth !== undefined) passenger.DateOfBirth = DateOfBirth;
      if (Gender !== undefined) passenger.Gender = Number(Gender);
      if (PassportNo !== undefined) passenger.PassportNo = PassportNo;
      if (PassportExpiry !== undefined) passenger.PassportExpiry = PassportExpiry;
      if (AddressLine1 !== undefined) passenger.AddressLine1 = AddressLine1;
      if (AddressLine2 !== undefined) passenger.AddressLine2 = AddressLine2;
      if (City !== undefined) passenger.City = City;
      if (CountryCode !== undefined) passenger.CountryCode = CountryCode;
      if (CountryName !== undefined) passenger.CountryName = CountryName;
      if (Nationality !== undefined) passenger.Nationality = Nationality;
      if (ContactNo !== undefined) passenger.ContactNo = ContactNo;
      if (Email !== undefined) passenger.Email = Email;
      if (IsLeadPax !== undefined) passenger.IsLeadPax = !!IsLeadPax;

      await user.save();
      return response.ok(res, { passenger });
    } catch (err) {
      return response.error(res, err.message);
    }
  },

  // DELETE /passengers/:passengerId
  deletePassenger: async (req, res) => {
    try {
      const { passengerId } = req.params;

      const User = mongoose.model('User');
      const user = await User.findById(req.user.id);
      if (!user) return response.notFound(res, 'User not found');

      const passenger = user.passengers.id(passengerId);
      if (!passenger) return response.notFound(res, 'Passenger not found');

      passenger.deleteOne();
      await user.save();
      return response.ok(res, { message: 'Passenger deleted successfully' });
    } catch (err) {
      return response.error(res, err.message);
    }
  },
};
