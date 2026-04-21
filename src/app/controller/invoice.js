const mongoose = require("mongoose");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const response = require("../responses");
const ShoppingOrder = mongoose.model("ShoppingOrder");
const FoodOrder = mongoose.model("FoodOrder");
const GroceryOrder = mongoose.model("GroceryOrder");

module.exports = {


//   testInvoice: async (req, res) => {
//     try {
//       const doc = new PDFDocument({
//         size: 'A4',
//         margin: 50
//       });

//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', 'attachment; filename=test-invoice.pdf');

//       doc.pipe(res);

//       doc.fontSize(32)
//          .font('Helvetica-Bold')
//          .fillColor('#1e3a8a')
//          .text('INVOICE', 50, 50);

//       doc.fontSize(16)
//          .font('Helvetica')
//          .fillColor('#000000')
//          .text('Test Invoice Generated Successfully!', 50, 120)
//          .text('Date: ' + new Date().toLocaleDateString(), 50, 150)
//          .text('Order ID: TEST-001', 50, 180)
//          .text('Customer: Test Customer', 50, 210)
//          .text('Total: $100.00', 50, 240);

//       // Finalize the PDF
//       doc.end();

//     } catch (error) {
//       console.error('PDF Generation Error:', error);
//       res.status(500).json({ error: 'PDF generation failed', details: error.message });
//     }
//   },

//   generateInvoice: async (req, res) => {
//     try {
//       // Get data from query parameters for browser access - YOUR DATA FIELDS
//       const payload = {
//         // Invoice Details
//         order_id: req.query.order_id || req.body?.order_id || 'N/A',
//         order_date: req.query.order_date || req.body?.order_date || new Date().toISOString(),
//         due_date: req.query.due_date || req.body?.due_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        
//         // Company Details (Your Business)
//         company_name: req.query.company_name || req.body?.company_name || 'N/A',
//         company_address: req.query.company_address || req.body?.company_address || 'N/A',
//         company_city: req.query.company_city || req.body?.company_city || 'N/A',
        
//         // Customer Details
//         customer_name: req.query.customer_name || req.body?.customer_name || 'N/A',
//         customer_address: req.query.customer_address || req.body?.customer_address || 'N/A',
//         customer_city: req.query.customer_city || req.body?.customer_city || 'N/A',
        
//         // Order Items (Your Food/Ride Data)
//         items: req.body?.items || [
//           {
//             qty: 0,
//             description: 'N/A',
//             unit_price: 0,
//             amount: 0
//           }
//         ],
        
//         // Financial Details (Your Order Data)
//         subtotal: parseFloat(req.query.subtotal || req.body?.subtotal || 0),
//         tax: parseFloat(req.query.tax || req.body?.tax || 0),
//         delivery_fee: parseFloat(req.query.delivery_fee || req.body?.delivery_fee || 0),
//         total: parseFloat(req.query.total || req.body?.total || 0),
        
      
//         payment_mode: req.query.payment_mode || req.body?.payment_mode || 'N/A',
//         status: req.query.status || req.body?.status || 'N/A'
//       };
      
//       const doc = new PDFDocument({
//         size: 'A4',
//         margin: 50
//       });

//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=invoice-${payload.order_id}.pdf`);

//       doc.pipe(res);

//       generateInvoiceContent(doc, payload);

//       doc.end();

//     } catch (error) {
//       console.error('PDF Generation Error:', error);
//       res.status(500).json({ error: 'PDF generation failed', details: error.message });
//     }
//   },

  generateInvoice: async (req, res) => {
    try {
      const { orderId,orderType,lang } = req.query;
      let order;
      if (orderType==='food') {
          order = await FoodOrder.findById(orderId)
           .populate("user_profile seller_profile productDetail.food_id");
         }
         else if(orderType==='grocery'){
         order = await GroceryOrder.findById(orderId)
          .populate("user_profile seller_profile productDetail.grocery_id");
         }
         else{
         order = await ShoppingOrder.findById(orderId)
          .populate("user_profile seller_profile productDetail.shopping_id");
        }

      if (!order) {
        return response.notFound(res, "Order not found");
      }
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

      doc.pipe(res);
      const obj={
        order_id: order.order_id,
        order_date: order.createdAt,
        due_date: new Date(order.createdAt.getTime() + 15 * 24 * 60 * 60 * 1000),
        company_name: "Canada Halal",
        company_address: "123 Halal Street",
        company_city: "Toronto, ON M5V 3A8",
        customer_name: order.user_profile?.username || "Customer",
        customer_address: order.shipping_address?.address || "N/A",
        customer_city: order.shipping_address?.city || "N/A",
        items: order.productDetail.map(item => ({
          qty: item.qty,
          description: orderType==='food'?item.food_name:orderType==='grocery'?item?.grocery_name:item?.shopping_name || 'N/A',
          unit_price: item.price,
          amount: item.qty * item.price
        })),
        subtotal: order.total,
        tax: order.tax,
        delivery_fee: order.total_deliverd_amount,
        discount: order?.discount,
        total: order.final_amount,
      //   payment_mode: order.paymentmode,
        status: order.status
      }
       lang == 'en' ? generateInvoiceContent(doc,obj ) : lang == 'ar' ? generateArabicInvoiceContent(doc,obj ) :lang == 'fr' ? generateFrenchInvoiceContent(doc,obj ) : lang == 'pt' ? generatePortugueseInvoiceContent(doc,obj ) : lang == 'wo' ? generateWolofInvoiceContent(doc,obj ) : lang == 'zh' ? generateChineseInvoiceContent(doc,obj ) : generateInvoiceContent(doc,obj );
      

      doc.end();

    } catch (error) {
      return response.error(res, error);
    }
  },

  generateRideInvoice: async (req, res) => {
    try {
      const { rideId,lang } = req.query;
      
      const Ride = mongoose.model("Ride");
      const ride = await Ride.findById(rideId)
        .populate("user_profile driver_profile");

      if (!ride) {
        return response.notFound(res, "Ride not found");
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${ride._id}.pdf`);

      doc.pipe(res);
      const obj= {
        invoice_id: ride.order_id,
        date: ride.createdAt,
        company_name: "Canada Halal Rides",
        company_address: "123 Halal Street",
        company_city: "Toronto, ON M5V 3A8",
        customer_name: ride.user_profile?.username || "Customer",
        customer_address: ride.source || "N/A",
        subtotal: ride.price,
        tax: ride.service_fee || 0,
      //   delivery_fee: 0,
        total: ride.final_price || ride.price,
        payment_mode: ride.payment_mode,
      //   status: ride.status,
        pickup: ride.source,
  drop: ride.destination,
//   base_fare: 50,
//   distance_fare: 120,
//   time_fare: 30,
//   tip: 20,
  driver_name: ride?.driver_profile?.username?ride?.driver_profile?.username:null,
  vehicle_info: ride?.driver_profile?.vehicle_company?`${ride?.driver_profile?.vehicle_company} ${ride?.driver_profile?.vehicle_model} - ${ride.driver_profile.number_plate_no}`:null,
      };
lang == 'en' ? generateRideInvoiceContent(doc,obj ) : lang == 'ar' ? generateArabicRideInvoiceContent(doc,obj ) :lang == 'fr' ? generateFrenchRideInvoiceContent(doc,obj ) : lang == 'pt' ? generatePortuguseRideInvoiceContent(doc,obj ) : lang == 'wo' ? generateWolofRideInvoiceContent(doc,obj ) : lang == 'zh' ? generateChineseRideInvoiceContent(doc,obj ) : generateRideInvoiceContent(doc,obj );
      // Finalize the PDF
      doc.end();

    } catch (error) {
      return response.error(res, error);
    }
  },
}

// Helper function to generate invoice content - EXACT UI REPLICA
function generateInvoiceContent(doc, data) {
  // Colors - Exact match from UI
  const darkBlue = '#1e3a8a';
  const red = '#dc2626';
  const black = '#000000';
  const gray = '#6b7280';

  // Header Section - EXACT REPLICA
  doc.fontSize(32)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('INVOICE', 50, 50);

  // Company Info (Left) - EXACT POSITIONING
//   doc.fontSize(12)
//      .font('Helvetica')
//      .fillColor(black)
//      .text(data.company_name || 'N/A', 50, 100)
//      .text(data.company_address || 'N/A', 50, 115)
//      .text(data.company_city || 'N/A', 50, 130);

      try {
      const logoPath = path.join(__dirname, '../../../public/images/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 490, 25, { width: 80, height: 80 });
      } else {
        
        doc.circle(520, 65, 40)
           .fillColor('#f3f4f6')
           .fill()
           .fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(gray)
           .text('LOGO', 505, 60);
      }
    } catch (error) {
      // Fallback to placeholder if error
      doc.circle(520, 65, 40)
         .fillColor('#f3f4f6')
         .fill()
         .fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(gray)
         .text('LOGO', 505, 60);
    }

  // Invoice Details (Right) - EXACT LAYOUT
  const rightX = 350;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue);

  doc.text('INVOICE #', rightX-30, 110)
     .text('INVOICE DATE', rightX-30, 140)
   //   .text('P.O.#', rightX, 140)
   //   .text('DUE DATE', rightX, 160);

  doc.font('Helvetica')
     .fontSize(10)
     .fillColor(black)
     .text(data.order_id || 'N/A', rightX + 70, 110)
     .text(data.order_date ? new Date(data.order_date).toLocaleDateString() : 'N/A', rightX + 70, 140)
   //   .text(data.order_id || 'N/A', rightX + 100, 140)
   //   .text(data.due_date ? new Date(data.due_date).toLocaleDateString() : 'N/A', rightX + 100, 160);

  // Address Sections - EXACT POSITIONING
  const addressY = 200;
  
  // BILL TO - EXACT MATCH
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('BILL TO', 50, addressY);

  doc.font('Helvetica')
     .fillColor(black)
     .text(data.customer_name || 'N/A', 50, addressY + 15)
     .text(data.customer_address || 'N/A', 50, addressY + 30,{
     width: 270
   })
     .text(data.customer_city || 'N/A', 50, addressY + 55);

  // SHIP TO - EXACT MATCH
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('SHIP TO', 320, addressY);

  doc.font('Helvetica')
     .fillColor(black)
     .text(data.customer_name || 'N/A', 320, addressY + 15)
     .text(data.customer_address || 'N/A', 320, addressY + 30)
     .text(data.customer_city || 'N/A', 320, addressY + 55);

  // Red line separator - EXACT POSITIONING
  doc.moveTo(50, addressY + 80)
     .lineTo(550, addressY + 80)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Headers - EXACT MATCH
  const tableY = addressY + 90;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(black)
     .text('QTY', 50, tableY)
     .text('PRODUCT', 120, tableY)
     .text('AMOUNT', 350, tableY)
     .text('TOTAL', 450, tableY);

  // Red line under headers - EXACT MATCH
  doc.moveTo(50, tableY + 20)
     .lineTo(550, tableY + 20)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Items - EXACT DATA FROM UI
  let currentY = tableY + 30;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black);

  if (data.items && data.items.length > 0) {
    data.items.forEach((item, index) => {
      doc.text((item.qty || 0).toString(), 50, currentY)
         .text(item.description || 'N/A', 120, currentY)
         .text(`CA$${(item.unit_price || 0).toFixed(2)}`, 350, currentY)
         .text(`CA$${(item.amount || 0).toFixed(2)}`, 450, currentY);
      
      currentY += 20;
    });
  } else {
    // Default items when no data
    doc.text('0', 50, currentY)
       .text('N/A', 120, currentY)
       .text('CA$0.00', 350, currentY)
       .text('CA$0.00', 450, currentY);
    currentY += 20;
  }

  // Summary Section (Right aligned) - EXACT MATCH
  const summaryY = currentY + 20;
  const summaryX = 350;

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black)
     .text('Subtotal', summaryX, summaryY)
     .text(`CA$${(data.subtotal || 0).toFixed(2)}`, summaryX + 100, summaryY);

  doc.text(`Tax 5%`, summaryX, summaryY + 15)
     .text(`CA$${(data.tax || 0)}`, summaryX + 100, summaryY + 15);

  if (data.delivery_fee && data.delivery_fee > 0) {
    doc.text('Delivery Fee & Tip', summaryX, summaryY + 30)
       .text(`CA$${data.delivery_fee.toFixed(2)}`, summaryX + 100, summaryY + 30);
  }
  if (data.discount && data.discount > 0) {
    doc.text('Discount', summaryX, summaryY + 45)
       .text(`CA$${data.discount.toFixed(2)}`, summaryX + 100, summaryY + 30);
  }

  // Total - EXACT MATCH
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('TOTAL', summaryX, summaryY + 70)
     .text(`CA$${(data.total || 0).toFixed(2)}`, summaryX + 100, summaryY + 70);

  // Signature Area - EXACT MATCH
//   doc.fontSize(12)
//      .font('Helvetica')
//      .fillColor(black)
//      .text('John Smith', summaryX, summaryY + 80);

  // Footer - EXACT MATCH
  const footerY = 700;
  
  // Thank you message (Left) - EXACT SCRIPT FONT
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('Thank you', 50, footerY);

  // Terms & Conditions (Right) - EXACT MATCH
//   doc.fontSize(12)
//      .font('Helvetica-Bold')
//      .fillColor(black)
//      .text('Keba Coly', 350, footerY);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black)
     .text('CHMP', 350, footerY + 20)
   //   .text('Payment is due within 15 days', 350, footerY + 20)
   //   .text('Please make checks payable to: East Repair Inc.', 350, footerY + 35);
}
function generateRideInvoiceContent(doc, data) {
  // Colors
  const darkBlue = '#1e3a8a';
  const red = '#dc2626';
  const black = '#000000';
  const gray = '#6b7280';

  // Header Title
  doc.fontSize(32)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('INVOICE', 50, 50);

  // Company Info (Left)
//   doc.fontSize(12)
//      .font('Helvetica')
//      .fillColor(black)
//      .text(data.company_name || 'Your App Name', 50, 100)
//      .text(data.company_address || 'Company Address', 50, 115)
//      .text(data.company_city || 'City, Country', 50, 130);

  // Logo (Right)
  try {
    const logoPath = path.join(__dirname, '../../../public/images/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 490, 25, { width: 80, height: 80 });
    } else {
      doc.circle(520, 65, 40)
         .fillColor('#f3f4f6')
         .fill()
         .fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(gray)
         .text('LOGO', 505, 60);
    }
  } catch {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(gray)
       .text('LOGO', 505, 60);
  }

  // Invoice Meta (Right)
  const rightX = 350;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('INVOICE #', rightX - 30, 110)
     .text('RIDE DATE', rightX - 30, 140);

  doc.font('Helvetica')
     .fontSize(10)
     .fillColor(black)
     .text(data.invoice_id || 'N/A', rightX + 70, 110)
   //   .text(data.date ?  new Date(data.date).toLocaleDateString() + ' ' + new Date(data.date).toLocaleTimeString() : 'N/A', rightX + 70, 140);

  // Address/Trip Info
  const addressY = 200;

  // BILL TO (User Info)
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('BILL TO', 50, addressY);

  doc.font('Helvetica')
     .fillColor(black)
     .text(data.customer_name || 'N/A', 50, addressY + 15)
     .text(data.customer_address || 'N/A', 50, addressY + 30, { width: 200 })
   //   .text(data.customer_city || 'N/A', 50, addressY + 45, { width: 270 });

  // SHIP TO → Change to "TRIP DETAILS"
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('TRIP DETAILS', 320, addressY);

  doc.font('Helvetica')
     .fillColor(black)
     .text(`From: ${data.pickup || 'N/A'}`, 320, addressY + 15)
     .text(`To: ${data.drop || 'N/A'}`, 320, addressY + 60)
   //   .text(`Time: ${data.time || 'N/A'}`, 320, addressY + 45);

  // Red separator
  doc.moveTo(50, addressY + 110)
     .lineTo(550, addressY + 110)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Header
  const tableY = addressY + 120;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(black)
     .text('DESCRIPTION', 50, tableY)
     .text('AMOUNT', 450, tableY);

  doc.moveTo(50, tableY + 20)
     .lineTo(550, tableY + 20)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Content
  let currentY = tableY + 30;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black)
     .text('Base Fare', 50, currentY)
     .text(`CA$${data.subtotal?.toFixed(2) || '0.00'}`, 450, currentY);

//   currentY += 20;
//   doc.text('Distance Fare', 50, currentY)
//      .text(`CA$${data.distance_fare?.toFixed(2) || '0.00'}`, 450, currentY);

//   currentY += 20;
//   doc.text('Time Fare', 50, currentY)
//      .text(`CA$${data.time_fare?.toFixed(2) || '0.00'}`, 450, currentY);

  currentY += 20;
  doc.text('Tax (5%)', 50, currentY)
     .text(`CA$${data.tax?.toFixed(2) || '0.00'}`, 450, currentY);

  if (data.tip && data.tip > 0) {
    currentY += 20;
    doc.text('Tip', 50, currentY)
       .text(`CA$${data.tip.toFixed(2)}`, 450, currentY);
  }

  // Total Fare
  currentY += 30;
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('TOTAL', 50, currentY)
     .text(`CA$${data.total?.toFixed(2) || '0.00'}`, 450, currentY);

  // Driver Section
  currentY += 40;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('DRIVER INFO', 50, currentY);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black)
     .text(`Driver Name: ${data.driver_name || 'N/A'}`, 50, currentY + 15)
     .text(`Vehicle: ${data.vehicle_info || 'N/A'}`, 50, currentY + 30);

  // Footer
  const footerY = 700;
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('Thank you', 50, footerY);

//   doc.fontSize(12)
//      .font('Helvetica-Bold')
//      .fillColor(black)
//      .text("Keba Coly", 350, footerY);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black)
     .text('CHMP', 350, footerY + 20);
}
function generateFrenchRideInvoiceContent(doc, data) {
const darkBlue = '#1e3a8a';
const red = '#dc2626';
const black = '#000000';
const gray = '#6b7280';

// Header Title
doc.fontSize(32)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('FACTURE', 50, 50); // INVOICE → FACTURE

// Company Info (Left)
// doc.fontSize(12)
//    .font('Helvetica')
//    .fillColor(black)
//    .text(data.company_name || 'Nom de votre application', 50, 100) // Your App Name
//    .text(data.company_address || "Adresse de l'entreprise", 50, 115) // Company Address
//    .text(data.company_city || 'Ville, Pays', 50, 130); // City, Country

// Logo (Right)
try {
  const logoPath = path.join(__dirname, '../../../public/images/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 490, 25, { width: 80, height: 80 });
  } else {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(gray)
       .text('LOGO', 505, 60);
  }
} catch {
  doc.circle(520, 65, 40)
     .fillColor('#f3f4f6')
     .fill()
     .fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(gray)
     .text('LOGO', 505, 60);
}

// Invoice Meta (Right)
const rightX = 350;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('N° DE FACTURE', rightX - 30, 110) // INVOICE # → N° DE FACTURE
   .text('DATE DE COURSE', rightX - 30, 140); // RIDE DATE

doc.font('Helvetica')
   .fontSize(10)
   .fillColor(black)
   .text(data.invoice_id || 'N/A', rightX + 70, 110);

// Address/Trip Info
const addressY = 200;

// BILL TO (User Info)
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('FACTURÉ À', 50, addressY); // BILL TO

doc.font('Helvetica')
   .fillColor(black)
   .text(data.customer_name || 'N/A', 50, addressY + 15)
   .text(data.customer_address || 'N/A', 50, addressY + 30, { width: 200 });

// SHIP TO → Change to "TRIP DETAILS"
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('DÉTAILS DU TRAJET', 320, addressY); // TRIP DETAILS

doc.font('Helvetica')
   .fillColor(black)
   .text(`De : ${data.pickup || 'N/A'}`, 320, addressY + 15) // From:
   .text(`À : ${data.drop || 'N/A'}`, 320, addressY + 60);   // To:

// Red separator
doc.moveTo(50, addressY + 110)
   .lineTo(550, addressY + 110)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Header
const tableY = addressY + 120;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(black)
   .text('DESCRIPTION', 50, tableY)
   .text('MONTANT', 450, tableY); // AMOUNT → MONTANT

doc.moveTo(50, tableY + 20)
   .lineTo(550, tableY + 20)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Content
let currentY = tableY + 30;
doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text('Tarif de base', 50, currentY) // Base Fare
   .text(`CA$${data.subtotal?.toFixed(2) || '0.00'}`, 450, currentY);

currentY += 20;
doc.text('Taxe (5%)', 50, currentY) // Tax (5%)
   .text(`CA$${data.tax?.toFixed(2) || '0.00'}`, 450, currentY);

if (data.tip && data.tip > 0) {
  currentY += 20;
  doc.text('Pourboire', 50, currentY) // Tip
     .text(`CA$${data.tip.toFixed(2)}`, 450, currentY);
}

// Total Fare
currentY += 30;
doc.fontSize(14)
   .font('Helvetica-Bold')
   .text('TOTAL', 50, currentY)
   .text(`CA$${data.total?.toFixed(2) || '0.00'}`, 450, currentY);

// Driver Section
currentY += 40;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('INFOS CHAUFFEUR', 50, currentY); // DRIVER INFO

doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text(`Nom du chauffeur : ${data.driver_name || 'N/A'}`, 50, currentY + 15) // Driver Name:
   .text(`Véhicule : ${data.vehicle_info || 'N/A'}`, 50, currentY + 30); // Vehicle:

// Footer
const footerY = 700;
doc.fontSize(24)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('Merci', 50, footerY); // Thank you

// doc.fontSize(12)
//    .font('Helvetica-Bold')
//    .fillColor(black)
//    .text("Keba Coly", 350, footerY);

doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text('CHMP', 350, footerY + 20);
}
function generatePortuguseRideInvoiceContent(doc, data) {
const darkBlue = '#1e3a8a';
const red = '#dc2626';
const black = '#000000';
const gray = '#6b7280';

// Header Title
doc.fontSize(32)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('FATURA', 50, 50); // INVOICE → FATURA

// Company Info (Left)
// doc.fontSize(12)
//    .font('Helvetica')
//    .fillColor(black)
//    .text(data.company_name || 'Nome do seu aplicativo', 50, 100) // Your App Name
//    .text(data.company_address || 'Endereço da empresa', 50, 115) // Company Address
//    .text(data.company_city || 'Cidade, País', 50, 130); // City, Country

// Logo (Right)
try {
  const logoPath = path.join(__dirname, '../../../public/images/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 490, 25, { width: 80, height: 80 });
  } else {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(gray)
       .text('LOGO', 505, 60);
  }
} catch {
  doc.circle(520, 65, 40)
     .fillColor('#f3f4f6')
     .fill()
     .fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(gray)
     .text('LOGO', 505, 60);
}

// Invoice Meta (Right)
const rightX = 350;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('Nº DA FATURA', rightX - 30, 110) // INVOICE # → Nº DA FATURA
   .text('DATA DA CORRIDA', rightX - 30, 140); // RIDE DATE

doc.font('Helvetica')
   .fontSize(10)
   .fillColor(black)
   .text(data.invoice_id || 'N/A', rightX + 70, 110);

// Address/Trip Info
const addressY = 200;

// BILL TO (User Info)
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('COBRAR DE', 50, addressY); // BILL TO

doc.font('Helvetica')
   .fillColor(black)
   .text(data.customer_name || 'N/A', 50, addressY + 15)
   .text(data.customer_address || 'N/A', 50, addressY + 30, { width: 200 });

// SHIP TO → Change to "TRIP DETAILS"
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('DETALHES DA VIAGEM', 320, addressY); // TRIP DETAILS

doc.font('Helvetica')
   .fillColor(black)
   .text(`De: ${data.pickup || 'N/A'}`, 320, addressY + 15) // From:
   .text(`Para: ${data.drop || 'N/A'}`, 320, addressY + 60); // To:

// Red separator
doc.moveTo(50, addressY + 110)
   .lineTo(550, addressY + 110)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Header
const tableY = addressY + 120;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(black)
   .text('DESCRIÇÃO', 50, tableY) // DESCRIPTION
   .text('VALOR', 450, tableY); // AMOUNT → VALOR

doc.moveTo(50, tableY + 20)
   .lineTo(550, tableY + 20)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Content
let currentY = tableY + 30;
doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text('Tarifa base', 50, currentY) // Base Fare
   .text(`CA$${data.subtotal?.toFixed(2) || '0.00'}`, 450, currentY);

currentY += 20;
doc.text('Imposto (5%)', 50, currentY) // Tax (5%)
   .text(`CA$${data.tax?.toFixed(2) || '0.00'}`, 450, currentY);

if (data.tip && data.tip > 0) {
  currentY += 20;
  doc.text('Gorjeta', 50, currentY) // Tip
     .text(`CA$${data.tip.toFixed(2)}`, 450, currentY);
}

// Total Fare
currentY += 30;
doc.fontSize(14)
   .font('Helvetica-Bold')
   .text('TOTAL', 50, currentY)
   .text(`CA$${data.total?.toFixed(2) || '0.00'}`, 450, currentY);

// Driver Section
currentY += 40;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('INFORMAÇÕES DO MOTORISTA', 50, currentY); // DRIVER INFO

doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text(`Nome do motorista: ${data.driver_name || 'N/A'}`, 50, currentY + 15) // Driver Name:
   .text(`Veículo: ${data.vehicle_info || 'N/A'}`, 50, currentY + 30); // Vehicle:

// Footer
const footerY = 700;
doc.fontSize(24)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('Obrigado', 50, footerY); // Thank you

// doc.fontSize(12)
//    .font('Helvetica-Bold')
//    .fillColor(black)
//    .text("Keba Coly", 350, footerY);

doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text('CHMP', 350, footerY + 20);

}
function generateWolofRideInvoiceContent(doc, data) {
const darkBlue = '#1e3a8a';
const red = '#dc2626';
const black = '#000000';
const gray = '#6b7280';

// Header Title
doc.fontSize(32)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('FAKTUR', 50, 50); // INVOICE → FAKTUR

// Company Info (Left)
// doc.fontSize(12)
//    .font('Helvetica')
//    .fillColor(black)
//    .text(data.company_name || 'Sa Jëfandikookat Bi', 50, 100) // Your App Name → Sa Jëfandikookat Bi
//    .text(data.company_address || 'Màkkaan bu Jëfandikookat Bi', 50, 115) // Company Address → Màkkaan bu Jëfandikookat Bi
//    .text(data.company_city || 'Dëkk, Réew', 50, 130); // City, Country → Dëkk, Réew

// Logo (Right)
try {
  const logoPath = path.join(__dirname, '../../../public/images/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 490, 25, { width: 80, height: 80 });
  } else {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(gray)
       .text('LOGO', 505, 60);
  }
} catch {
  doc.circle(520, 65, 40)
     .fillColor('#f3f4f6')
     .fill()
     .fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(gray)
     .text('LOGO', 505, 60);
}

// Invoice Meta (Right)
const rightX = 350;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('FAKTUR #', rightX - 30, 110) // INVOICE # → FAKTUR #
   .text('BESU WÀLL', rightX - 30, 140); // RIDE DATE → BESU WÀLL

doc.font('Helvetica')
   .fontSize(10)
   .fillColor(black)
   .text(data.invoice_id || 'N/A', rightX + 70, 110);

// Address/Trip Info
const addressY = 200;

// BILL TO (User Info)
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('JÀNGATU CI', 50, addressY); // BILL TO → JÀNGATU CI

doc.font('Helvetica')
   .fillColor(black)
   .text(data.customer_name || 'N/A', 50, addressY + 15)
   .text(data.customer_address || 'N/A', 50, addressY + 30, { width: 200 });

// TRIP DETAILS
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('BENNOO YU WÀLL', 320, addressY); // TRIP DETAILS → BENNOO YU WÀLL

doc.font('Helvetica')
   .fillColor(black)
   .text(`Dëkk bi mu jóge: ${data.pickup || 'N/A'}`, 320, addressY + 15) // From → Dëkk bi mu jóge
   .text(`Dëkk bi mu dem: ${data.drop || 'N/A'}`, 320, addressY + 60); // To → Dëkk bi mu dem

// Red separator
doc.moveTo(50, addressY + 110)
   .lineTo(550, addressY + 110)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Header
const tableY = addressY + 120;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(black)
   .text('NATTUKAT', 50, tableY) // DESCRIPTION → NATTUKAT
   .text('NDAMMU', 450, tableY); // AMOUNT → NDAMMU

doc.moveTo(50, tableY + 20)
   .lineTo(550, tableY + 20)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Content
let currentY = tableY + 30;
doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text('Ndaje bu Njàmbaar', 50, currentY) // Base Fare → Ndaje bu Njàmbaar
   .text(`CA$${data.subtotal?.toFixed(2) || '0.00'}`, 450, currentY);

currentY += 20;
doc.text('Jariñu (5%)', 50, currentY) // Tax → Jariñu
   .text(`CA$${data.tax?.toFixed(2) || '0.00'}`, 450, currentY);

if (data.tip && data.tip > 0) {
  currentY += 20;
  doc.text('Tëralin', 50, currentY) // Tip → Tëralin
     .text(`CA$${data.tip.toFixed(2)}`, 450, currentY);
}

// Total Fare
currentY += 30;
doc.fontSize(14)
   .font('Helvetica-Bold')
   .text('LIMU MU TOGG', 50, currentY) // TOTAL → LIMU MU TOGG
   .text(`CA$${data.total?.toFixed(2) || '0.00'}`, 450, currentY);

// Driver Section
currentY += 40;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('BENN WÀLLU JËFANDIKO', 50, currentY); // DRIVER INFO → BENN WÀLLU JËFANDIKO

doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text(`Turu Jëfandikookat: ${data.driver_name || 'N/A'}`, 50, currentY + 15) // Driver Name → Turu Jëfandikookat
   .text(`Moto/Taxi: ${data.vehicle_info || 'N/A'}`, 50, currentY + 30); // Vehicle → Moto/Taxi

// Footer
const footerY = 700;
doc.fontSize(24)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('Jërëjëf', 50, footerY); // Thank you → Jërëjëf

// doc.fontSize(12)
//    .font('Helvetica-Bold')
//    .fillColor(black)
//    .text("Keba Coly", 350, footerY);

doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text('CHMP', 350, footerY + 20);
}
function generateChineseRideInvoiceContent(doc, data) {
const darkBlue = '#1e3a8a';
const red = '#dc2626';
const black = '#000000';
const gray = '#6b7280';

// Header Title
doc.fontSize(32)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('发票', 50, 50); // INVOICE → 发票

// Company Info (Left)
// doc.fontSize(12)
//    .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
//    .fillColor(black)
//    .text(data.company_name || '您的应用名称', 50, 100) // Your App Name → 您的应用名称
//    .text(data.company_address || '公司地址', 50, 115) // Company Address → 公司地址
//    .text(data.company_city || '城市，国家', 50, 130); // City, Country → 城市，国家

// Logo (Right)
try {
  const logoPath = path.join(__dirname, '../../../public/images/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 490, 25, { width: 80, height: 80 });
  } else {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
       .fillColor(gray)
       .text('LOGO', 505, 60);
  }
} catch {
  doc.circle(520, 65, 40)
     .fillColor('#f3f4f6')
     .fill()
     .fontSize(12)
     .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
     .fillColor(gray)
     .text('LOGO', 505, 60);
}

// Invoice Meta (Right)
const rightX = 350;
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('发票号', rightX - 30, 110) // INVOICE # → 发票号
   .text('行程日期', rightX - 30, 140); // RIDE DATE → 行程日期

doc.font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fontSize(10)
   .fillColor(black)
   .text(data.invoice_id || 'N/A', rightX + 70, 110);

// Address/Trip Info
const addressY = 200;

// BILL TO (User Info)
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('账单寄送至', 50, addressY); // BILL TO → 账单寄送至

doc.font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text(data.customer_name || 'N/A', 50, addressY + 15)
   .text(data.customer_address || 'N/A', 50, addressY + 30, { width: 200 });

// TRIP DETAILS
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('行程详情', 320, addressY); // TRIP DETAILS → 行程详情

doc.font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text(`出发地: ${data.pickup || 'N/A'}`, 320, addressY + 15) // From → 出发地
   .text(`目的地: ${data.drop || 'N/A'}`, 320, addressY + 60); // To → 目的地

// Red separator
doc.moveTo(50, addressY + 110)
   .lineTo(550, addressY + 110)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Header
const tableY = addressY + 120;
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text('描述', 50, tableY) // DESCRIPTION → 描述
   .text('金额', 450, tableY); // AMOUNT → 金额

doc.moveTo(50, tableY + 20)
   .lineTo(550, tableY + 20)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Content
let currentY = tableY + 30;
doc.fontSize(10)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text('起步费', 50, currentY) // Base Fare → 起步费
   .text(`CA$${data.subtotal?.toFixed(2) || '0.00'}`, 450, currentY);

currentY += 20;
doc.text('税 (5%)', 50, currentY) // Tax → 税
   .text(`CA$${data.tax?.toFixed(2) || '0.00'}`, 450, currentY);

if (data.tip && data.tip > 0) {
  currentY += 20;
  doc.text('小费', 50, currentY) // Tip → 小费
     .text(`CA$${data.tip.toFixed(2)}`, 450, currentY);
}

// Total Fare
currentY += 30;
doc.fontSize(14)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .text('总计', 50, currentY) // TOTAL → 总计
   .text(`CA$${data.total?.toFixed(2) || '0.00'}`, 450, currentY);

// Driver Section
currentY += 40;
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('司机信息', 50, currentY); // DRIVER INFO → 司机信息

doc.fontSize(10)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text(`司机姓名: ${data.driver_name || 'N/A'}`, 50, currentY + 15) // Driver Name → 司机姓名
   .text(`车辆: ${data.vehicle_info || 'N/A'}`, 50, currentY + 30); // Vehicle → 车辆

// Footer
const footerY = 700;
doc.fontSize(24)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('谢谢您', 50, footerY); // Thank you → 谢谢您

// doc.fontSize(12)
//    .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
//    .fillColor(black)
//    .text("Keba Coly", 350, footerY);

doc.fontSize(10)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text('CHMP', 350, footerY + 20); // CHMP Pvt. Ltd. → CHMP 私人有限公司

}
function generateArabicRideInvoiceContent(doc, data) {
const darkBlue = '#1e3a8a';
const red = '#dc2626';
const black = '#000000';
const gray = '#6b7280';

// Header Title
doc.fontSize(32)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(darkBlue)
   .text(`${'فاتورة'}`, 50, 50);

// Company Info (Left)
// doc.fontSize(12)
//    .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
//    .fillColor(black)
//    .text(`${data.company_name || 'اسم الشركة'}`, 50, 100)
//    .text(`${data.company_address || 'عنوان الشركة'}`, 50, 115)
//    .text(`${data.company_city || 'المدينة، الدولة'}`, 50, 130);

// Logo (Right)
try {
  const logoPath = path.join(__dirname, '../../../public/images/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 490, 25, { width: 80, height: 80 });
  } else {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
       .fillColor(gray)
       .text(`${'الشعار'}`, 505, 60);
  }
} catch {
  doc.circle(520, 65, 40)
     .fillColor('#f3f4f6')
     .fill()
     .fontSize(12)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(gray)
     .text(`${'الشعار'}`, 505, 60);
}

// Invoice Meta (Right)
const rightX = 350;
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(darkBlue)
   .text(`${'رقم الفاتورة'}`, rightX - 30, 110)
   .text(`${'تاريخ الرحلة'}`, rightX - 30, 140);

doc.font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fontSize(10)
   .fillColor(black)
   .text(`${data.invoice_id || 'N/A'}`, rightX + 70, 110);

// Address/Trip Info
const addressY = 200;

// BILL TO (User Info)
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(darkBlue)
   .text(`${'فاتورة إلى'}`, 50, addressY);

doc.font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(black)
   .text(`${data.customer_name || 'N/A'}`, 50, addressY + 15)
   .text(`${data.customer_address || 'N/A'}`, 50, addressY + 30, { width: 200 });

// TRIP DETAILS
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(darkBlue)
   .text(`${'تفاصيل الرحلة'}`, 320, addressY);

doc.font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(black)
   .text(`${':من '}  ${data.pickup || 'N/A'}`, 320, addressY + 15)
   .text(`${':إلى '}  ${data.drop || 'N/A'}`, 320, addressY + 70);

// Red separator
doc.moveTo(50, addressY + 140)
   .lineTo(550, addressY + 140)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Header
const tableY = addressY + 145;
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(black)
   .text(`${'الوصف'}`, 50, tableY)
   .text(`${'المبلغ'}`, 450, tableY);

doc.moveTo(50, tableY + 25)
   .lineTo(550, tableY + 25)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Content
let currentY = tableY + 30;
doc.fontSize(10)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(black)
   .text(`${'الأجرة الأساسية'}`, 50, currentY)
   .text(`CA$${data.subtotal?.toFixed(2) || '0.00'}`, 450, currentY);

currentY += 20;
doc.text(`${'الضريبة (5%)'}`, 50, currentY)
   .text(`CA$${data.tax?.toFixed(2) || '0.00'}`, 450, currentY);

if (data.tip && data.tip > 0) {
  currentY += 20;
  doc.text(`${'الإكرامية'}`, 50, currentY)
     .text(`CA$${data.tip.toFixed(2)}`, 450, currentY);
}

// Total Fare
currentY += 30;
doc.fontSize(14)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .text(`${'ﺍﻹﺟﻤﺎﻟﻲ'}`, 50, currentY)
   .text(`CA$${data.total?.toFixed(2) || '0.00'}`, 450, currentY);

// Driver Section
currentY += 40;
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(darkBlue)
   .text(`${'معلومات السائق'}`, 50, currentY);

doc.fontSize(10)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(black)
   .text(`${'اسم السائق: '}  ${data.driver_name || 'N/A'}`, 50, currentY + 15)
   .text(`${'المركبة: '}  ${data.vehicle_info || 'N/A'}`, 50, currentY + 30);

// Footer
const footerY = 700;
doc.fontSize(24)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(darkBlue)
   .text(`${'شكراً لك'}`, 50, footerY);

// doc.fontSize(12)
//    .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
//    .fillColor(black)
//    .text(`${'كيبا كولي'}`, 350, footerY);

doc.fontSize(10)
   .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
   .fillColor(black)
   .text(`${'CHMP'}`, 350, footerY + 20);

}

// Helper function to generate Portuguese invoice content - EXACT UI REPLICA
function generatePortugueseInvoiceContent(doc, data) {
  // Colors - Exact match from UI
  const darkBlue = '#1e3a8a';
  const red = '#dc2626';
  const black = '#000000';
  const gray = '#6b7280';

  // Header Section - EXACT REPLICA
  doc.fontSize(32)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('FATURA', 50, 50); // INVOICE → FATURA

  // Company Info (Left) - EXACT POSITIONING
//   doc.fontSize(12)
//      .font('Helvetica')
//      .fillColor(black)
//      .text(data.company_name || 'N/A', 50, 100)
//      .text(data.company_address || 'N/A', 50, 115)
//      .text(data.company_city || 'N/A', 50, 130);

  try {
    const logoPath = path.join(__dirname, '../../../public/images/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 490, 25, { width: 80, height: 80 });
    } else {
      doc.circle(520, 65, 40)
         .fillColor('#f3f4f6')
         .fill()
         .fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(gray)
         .text('LOGO', 505, 60);
    }
  } catch (error) {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(gray)
       .text('LOGO', 505, 60);
  }

  // Invoice Details (Right)
  const rightX = 350;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue);

  doc.text('Nº FATURA', rightX - 30, 110) // INVOICE # → Nº FATURA
     .text('DATA DA FATURA', rightX - 30, 140,{width:80}); // INVOICE DATE → DATA DA FATURA

  doc.font('Helvetica')
     .fontSize(10)
     .fillColor(black)
     .text(data.order_id || 'N/A', rightX + 70, 110)
     .text(data.order_date ? new Date(data.order_date).toLocaleDateString() : 'N/A', rightX + 70, 140);

  // Address Sections
  const addressY = 200;
  
  // BILL TO
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('COBRAR DE', 50, addressY); // BILL TO → COBRAR DE

  doc.font('Helvetica')
     .fillColor(black)
     .text(data.customer_name || 'N/A', 50, addressY + 15)
     .text(data.customer_address || 'N/A', 50, addressY + 30, { width: 270 })
     .text(data.customer_city || 'N/A', 50, addressY + 55);

  // SHIP TO
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('ENVIAR PARA', 320, addressY); // SHIP TO → ENVIAR PARA

  doc.font('Helvetica')
     .fillColor(black)
     .text(data.customer_name || 'N/A', 320, addressY + 15)
     .text(data.customer_address || 'N/A', 320, addressY + 30)
     .text(data.customer_city || 'N/A', 320, addressY + 55);

  // Red line separator
  doc.moveTo(50, addressY + 80)
     .lineTo(550, addressY + 80)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Headers
  const tableY = addressY + 90;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(black)
     .text('QTD', 50, tableY) // QTY → QTD
     .text('PRODUTO', 120, tableY) // PRODUCT → PRODUTO
     .text('VALOR', 350, tableY) // AMOUNT → VALOR
     .text('TOTAL', 450, tableY); // TOTAL → TOTAL (same in PT)

  // Red line under headers
  doc.moveTo(50, tableY + 20)
     .lineTo(550, tableY + 20)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Items
  let currentY = tableY + 30;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black);

  if (data.items && data.items.length > 0) {
    data.items.forEach((item) => {
      doc.text((item.qty || 0).toString(), 50, currentY)
         .text(item.description || 'N/A', 120, currentY)
         .text(`CA$${(item.unit_price || 0).toFixed(2)}`, 350, currentY)
         .text(`CA$${(item.amount || 0).toFixed(2)}`, 450, currentY);
      currentY += 20;
    });
  } else {
    doc.text('0', 50, currentY)
       .text('N/A', 120, currentY)
       .text('CA$0.00', 350, currentY)
       .text('CA$0.00', 450, currentY);
    currentY += 20;
  }

  // Summary Section
  const summaryY = currentY + 20;
  const summaryX = 350;

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black)
     .text('Subtotal', summaryX, summaryY) // Subtotal → Subtotal (same in PT-BR, or "Subtotal" is common)
     .text(`CA$${(data.subtotal || 0).toFixed(2)}`, summaryX + 100, summaryY);

  doc.text(`Imposto 5%`, summaryX, summaryY + 15) // Tax → Imposto
     .text(`CA$${(data.tax || 0)}`, summaryX + 100, summaryY + 15);

  if (data.delivery_fee && data.delivery_fee > 0) {
    doc.text('Taxa de entrega & gorjeta', summaryX, summaryY + 30,{width:80}) // Delivery Fee & Tip → Taxa de entrega & gorjeta
       .text(`CA$${data.delivery_fee.toFixed(2)}`, summaryX + 100, summaryY + 30);
  }
  if (data.discount && data.discount > 0) {
    doc.text('Desconto', summaryX, summaryY + 45) // Discount → Desconto
       .text(`CA$${data.discount.toFixed(2)}`, summaryX + 100, summaryY + 30);
  }

  // Total
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('TOTAL', summaryX, summaryY + 70)
     .text(`CA$${(data.total || 0).toFixed(2)}`, summaryX + 100, summaryY + 70);

  // Footer
  const footerY = 700;
  
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('Obrigado', 50, footerY); // Thank you → Obrigado

//   doc.fontSize(12)
//      .font('Helvetica-Bold')
//      .fillColor(black)
//      .text('Keba Coly', 350, footerY);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black)
     .text('CHMP', 350, footerY + 20);
}

// Helper function to generate French invoice content - EXACT UI REPLICA
function generateFrenchInvoiceContent(doc, data) {
  // Colors - Exact match from UI
  const darkBlue = '#1e3a8a';
  const red = '#dc2626';
  const black = '#000000';
  const gray = '#6b7280';

  // Header Section - EXACT REPLICA
  doc.fontSize(32)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('FACTURE', 50, 50); // INVOICE → FACTURE

  // Company Info (Left) - EXACT POSITIONING
//   doc.fontSize(12)
//      .font('Helvetica')
//      .fillColor(black)
//      .text(data.company_name || 'N/A', 50, 100)
//      .text(data.company_address || 'N/A', 50, 115)
//      .text(data.company_city || 'N/A', 50, 130);

  try {
    const logoPath = path.join(__dirname, '../../../public/images/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 490, 25, { width: 80, height: 80 });
    } else {
      doc.circle(520, 65, 40)
         .fillColor('#f3f4f6')
         .fill()
         .fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(gray)
         .text('LOGO', 505, 60);
    }
  } catch (error) {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(gray)
       .text('LOGO', 505, 60);
  }

  // Invoice Details (Right) - EXACT LAYOUT
  const rightX = 350;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue);

  doc.text('N° FACTURE', rightX - 30, 110) // INVOICE # → N° FACTURE
     .text('DATE DE FACTURE', rightX - 30, 140,{width:80}); // INVOICE DATE → DATE DE FACTURE

  doc.font('Helvetica')
     .fontSize(10)
     .fillColor(black)
     .text(data.order_id || 'N/A', rightX + 70, 110)
     .text(data.order_date ? new Date(data.order_date).toLocaleDateString() : 'N/A', rightX + 70, 140);

  // Address Sections - EXACT POSITIONING
  const addressY = 200;
  
  // BILL TO
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('FACTURER À', 50, addressY); // BILL TO → FACTURER À

  doc.font('Helvetica')
     .fillColor(black)
     .text(data.customer_name || 'N/A', 50, addressY + 15)
     .text(data.customer_address || 'N/A', 50, addressY + 30, { width: 270 })
     .text(data.customer_city || 'N/A', 50, addressY + 55);

  // SHIP TO
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('EXPÉDIER À', 320, addressY); // SHIP TO → EXPÉDIER À

  doc.font('Helvetica')
     .fillColor(black)
     .text(data.customer_name || 'N/A', 320, addressY + 15)
     .text(data.customer_address || 'N/A', 320, addressY + 30)
     .text(data.customer_city || 'N/A', 320, addressY + 55);

  // Red line separator
  doc.moveTo(50, addressY + 80)
     .lineTo(550, addressY + 80)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Headers
  const tableY = addressY + 90;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(black)
     .text('QTE', 50, tableY) // QTY → QTE
     .text('PRODUIT', 120, tableY) // PRODUCT → PRODUIT
     .text('MONTANT', 350, tableY) // AMOUNT → MONTANT
     .text('TOTAL', 450, tableY); // TOTAL → TOTAL (same in FR)

  // Red line under headers
  doc.moveTo(50, tableY + 20)
     .lineTo(550, tableY + 20)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Items
  let currentY = tableY + 30;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black);

  if (data.items && data.items.length > 0) {
    data.items.forEach((item) => {
      doc.text((item.qty || 0).toString(), 50, currentY)
         .text(item.description || 'N/A', 120, currentY)
         .text(`CA$${(item.unit_price || 0).toFixed(2)}`, 350, currentY)
         .text(`CA$${(item.amount || 0).toFixed(2)}`, 450, currentY);
      currentY += 20;
    });
  } else {
    doc.text('0', 50, currentY)
       .text('N/A', 120, currentY)
       .text('CA$0.00', 350, currentY)
       .text('CA$0.00', 450, currentY);
    currentY += 20;
  }

  // Summary Section
  const summaryY = currentY + 20;
  const summaryX = 350;

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black)
     .text('Sous-total', summaryX, summaryY) // Subtotal → Sous-total
     .text(`CA$${(data.subtotal || 0).toFixed(2)}`, summaryX + 100, summaryY);

  doc.text(`Taxe 5%`, summaryX, summaryY + 15) // Tax → Taxe
     .text(`CA$${(data.tax || 0)}`, summaryX + 100, summaryY + 15);

  if (data.delivery_fee && data.delivery_fee > 0) {
    doc.text('Frais de livraison & pourboire', summaryX, summaryY + 30,{width:80}) // Delivery Fee & Tip → Frais de livraison & pourboire
       .text(`CA$${data.delivery_fee.toFixed(2)}`, summaryX + 100, summaryY + 30);
  }
  if (data.discount && data.discount > 0) {
    doc.text('Remise', summaryX, summaryY + 45) // Discount → Remise
       .text(`CA$${data.discount.toFixed(2)}`, summaryX + 100, summaryY + 30);
  }

  // Total
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('TOTAL', summaryX, summaryY + 70)
     .text(`CA$${(data.total || 0).toFixed(2)}`, summaryX + 100, summaryY + 70);

  // Footer
  const footerY = 700;
  
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(darkBlue)
     .text('Merci', 50, footerY); // Thank you → Merci

//   doc.fontSize(12)
//      .font('Helvetica-Bold')
//      .fillColor(black)
//      .text('Keba Coly', 350, footerY);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(black)
     .text('CHMP', 350, footerY + 20);
}

// Helper function to generate Arabic invoice content - EXACT UI REPLICA
function generateArabicInvoiceContent(doc, data) {
  // Colors - Exact match from UI
  const darkBlue = '#1e3a8a';
  const red = '#dc2626';
  const black = '#000000';
  const gray = '#6b7280';

  // Header Section
  doc.fontSize(32)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(darkBlue)
     .text('فاتورة', 50, 50); // INVOICE → فاتورة

  // Company Info
//   doc.fontSize(12)
//      .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
//      .fillColor(black)
//      .text(data.company_name || 'N/A', 50, 100)
//      .text(data.company_address || 'N/A', 50, 115)
//      .text(data.company_city || 'N/A', 50, 130);

  try {
    const logoPath = path.join(__dirname, '../../../public/images/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 490, 25, { width: 80, height: 80 });
    } else {
      doc.circle(520, 65, 40)
         .fillColor('#f3f4f6')
         .fill()
         .fontSize(12)
         .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
         .fillColor(gray)
         .text('شعار', 505, 60); // LOGO → شعار
    }
  } catch (error) {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
       .fillColor(gray)
       .text('شعار', 505, 60);
  }

  // Invoice Details
  const rightX = 350;
  doc.fontSize(12)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(darkBlue);

  doc.text('رقم الفاتورة', rightX - 30, 110) // INVOICE # → رقم الفاتورة
     .text('تاريخ الفاتورة', rightX - 30, 140); // INVOICE DATE → تاريخ الفاتورة

  doc.font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fontSize(10)
     .fillColor(black)
     .text(data.order_id || 'N/A', rightX + 70, 110)
     .text(data.order_date ? new Date(data.order_date).toLocaleDateString() : 'N/A', rightX + 70, 140);

  // Address Sections
  const addressY = 200;
  
  // BILL TO
  doc.fontSize(12)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(darkBlue)
     .text('إصدار الفاتورة إلى', 50, addressY); // BILL TO → إصدار الفاتورة إلى

  doc.font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(black)
     .text(data.customer_name || 'N/A', 50, addressY + 15)
     .text(data.customer_address || 'N/A', 50, addressY + 30, { width: 270 })
     .text(data.customer_city || 'N/A', 50, addressY + 55);

  // SHIP TO
  doc.fontSize(12)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(darkBlue)
     .text('الشحن إلى', 320, addressY); // SHIP TO → الشحن إلى

  doc.font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(black)
     .text(data.customer_name || 'N/A', 320, addressY + 15)
     .text(data.customer_address || 'N/A', 320, addressY + 30)
     .text(data.customer_city || 'N/A', 320, addressY + 55);

  // Separator
  doc.moveTo(50, addressY + 80)
     .lineTo(550, addressY + 80)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Headers
  const tableY = addressY + 90;
  doc.fontSize(12)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(black)
     .text('العدد', 50, tableY)      // QTY → العدد (means "count" or "quantity")
     .text('الصنف', 120, tableY)     // PRODUCT → الصنف (means "item" or "type")
     .text('القيمة', 350, tableY)    // AMOUNT → القيمة (means "value" or "amount")
     .text('المجموع', 450, tableY);

  // Red line under headers
  doc.moveTo(50, tableY + 25)
     .lineTo(550, tableY + 25)
     .strokeColor(red)
     .lineWidth(1)
     .stroke();

  // Table Items
  let currentY = tableY + 35;
  doc.fontSize(10)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(black);

  if (data.items && data.items.length > 0) {
    data.items.forEach((item) => {
      doc.text((item.qty || 0).toString(), 50, currentY)
         .text(item.description || 'N/A', 120, currentY)
         .text(`CA$${(item.unit_price || 0).toFixed(2)}`, 350, currentY)
         .text(`CA$${(item.amount || 0).toFixed(2)}`, 450, currentY);
      currentY += 20;
    });
  } else {
    doc.text('0', 50, currentY)
       .text('N/A', 120, currentY)
       .text('CA$0.00', 350, currentY)
       .text('CA$0.00', 450, currentY);
    currentY += 20;
  }

  // Summary
  const summaryY = currentY + 20;
  const summaryX = 350;

  doc.fontSize(10)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(black)
     .text('المجموع الفرعي', summaryX, summaryY) // Subtotal → المجموع الفرعي
     .text(`CA$${(data.subtotal || 0).toFixed(2)}`, summaryX + 100, summaryY);

  doc.text('ضريبة 5%', summaryX, summaryY + 15) // Tax → ضريبة
     .text(`CA$${(data.tax || 0)}`, summaryX + 100, summaryY + 15);

  if (data.delivery_fee && data.delivery_fee > 0) {
    doc.text('رسوم التوصيل والبقشيش', summaryX, summaryY + 30) // Delivery Fee & Tip → رسوم التوصيل والبقشيش
       .text(`CA$${data.delivery_fee.toFixed(2)}`, summaryX + 100, summaryY + 30);
  }
  if (data.discount && data.discount > 0) {
    doc.text('خصم', summaryX, summaryY + 45) // Discount → خصم
       .text(`CA$${data.discount.toFixed(2)}`, summaryX + 100, summaryY + 30);
  }

  // Total
  doc.fontSize(14)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .text('ﺍﻹﺟﻤﺎﻟﻲ', summaryX, summaryY + 70) // TOTAL → الإجمالي
     .text(`CA$${(data.total || 0).toFixed(2)}`, summaryX + 100, summaryY + 70);

  // Footer
  const footerY = 700;
  
  doc.fontSize(24)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(darkBlue)
     .text('شكرًا لك', 50, footerY); // Thank you → شكرًا لك

//   doc.fontSize(12)
//      .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
//      .fillColor(black)
//      .text('كيبا كولي', 350, footerY); // Keba Coly → كيبا كولي

  doc.fontSize(10)
     .font(path.join(__dirname, "../../../fonts/NotoNaskhArabic-Regular.ttf"))
     .fillColor(black)
     .text('CHMP', 350, footerY + 20);
}

// Helper function to generate Wolof invoice content - EXACT UI REPLICA
function generateWolofInvoiceContent(doc, data) {
const darkBlue = '#1e3a8a';
const red = '#dc2626';
const black = '#000000';
const gray = '#6b7280';

// Header Section
doc.fontSize(32)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('FAKTUR', 50, 50); // INVOICE → FAKTUR (commonly used in Wolof)


// Company Info (Left)
// doc.fontSize(12)
//    .font('Helvetica')
//    .fillColor(black)
//    .text(data.company_name || 'N/A', 50, 100)
//    .text(data.company_address || 'N/A', 50, 115)
//    .text(data.company_city || 'N/A', 50, 130);

try {
  const logoPath = path.join(__dirname, '../../../public/images/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 490, 25, { width: 80, height: 80 });
  } else {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(gray)
       .text('LOGO', 505, 60);
  }
} catch (error) {
  doc.circle(520, 65, 40)
     .fillColor('#f3f4f6')
     .fill()
     .fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(gray)
     .text('LOGO', 505, 60);
}

// Invoice Details (Right)
const rightX = 350;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue);

doc.text('FAKTUR #', rightX - 30, 110) // INVOICE #
   .text('BESU FAKTUR', rightX - 30, 140); // INVOICE DATE → BESU FAKTUR

doc.font('Helvetica')
   .fontSize(10)
   .fillColor(black)
   .text(data.order_id || 'N/A', rightX + 70, 110)
   .text(data.order_date ? new Date(data.order_date).toLocaleDateString() : 'N/A', rightX + 70, 140);

// Address Sections
const addressY = 200;

// BILL TO
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('DEFARU CI', 50, addressY); // BILL TO → DEFARU CI

doc.font('Helvetica')
   .fillColor(black)
   .text(data.customer_name || 'N/A', 50, addressY + 15)
   .text(data.customer_address || 'N/A', 50, addressY + 30, {
     width: 270
   })
   .text(data.customer_city || 'N/A', 50, addressY + 55);

// SHIP TO
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('YÓNNE CI', 320, addressY); // SHIP TO → YÓNNE CI

doc.font('Helvetica')
   .fillColor(black)
   .text(data.customer_name || 'N/A', 320, addressY + 15)
   .text(data.customer_address || 'N/A', 320, addressY + 30)
   .text(data.customer_city || 'N/A', 320, addressY + 55);

// Red line separator
doc.moveTo(50, addressY + 80)
   .lineTo(550, addressY + 80)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Headers
const tableY = addressY + 90;
doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor(black)
   .text('KANT.', 50, tableY)       // QTY → KANT. (short for "Quantity")
   .text('PRODU', 120, tableY)      // PRODUCT → PRODU
   .text('NJARIÑ', 350, tableY)     // AMOUNT → NJARIÑ
   .text('TOTAL', 450, tableY);     // TOTAL → TOTAL

// Red line under headers
doc.moveTo(50, tableY + 20)
   .lineTo(550, tableY + 20)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Items
let currentY = tableY + 30;
doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black);

if (data.items && data.items.length > 0) {
  data.items.forEach((item) => {
    doc.text((item.qty || 0).toString(), 50, currentY)
       .text(item.description || 'N/A', 120, currentY)
       .text(`CA$${(item.unit_price || 0).toFixed(2)}`, 350, currentY)
       .text(`CA$${(item.amount || 0).toFixed(2)}`, 450, currentY);
    currentY += 20;
  });
} else {
  doc.text('0', 50, currentY)
     .text('N/A', 120, currentY)
     .text('CA$0.00', 350, currentY)
     .text('CA$0.00', 450, currentY);
  currentY += 20;
}

// Summary Section
const summaryY = currentY + 20;
const summaryX = 350;

doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text('JÀMBOORU', summaryX, summaryY) // Subtotal → JÀMBOORU
   .text(`CA$${(data.subtotal || 0).toFixed(2)}`, summaryX + 100, summaryY);

doc.text(`XARSI 5%`, summaryX, summaryY + 15) // Tax → XARSI
   .text(`CA$${(data.tax || 0)}`, summaryX + 100, summaryY + 15);

if (data.delivery_fee && data.delivery_fee > 0) {
  doc.text('FEE YÓNNE & TIP', summaryX, summaryY + 30) // Delivery Fee & Tip → FEE YÓNNE & TIP
     .text(`CA$${data.delivery_fee.toFixed(2)}`, summaryX + 100, summaryY + 30);
}
if (data.discount && data.discount > 0) {
  doc.text('RABAIS', summaryX, summaryY + 45) // Discount → RABAIS
     .text(`CA$${data.discount.toFixed(2)}`, summaryX + 100, summaryY + 30);
}

// Total
doc.fontSize(14)
   .font('Helvetica-Bold')
   .text('TOTAL', summaryX, summaryY + 70)
   .text(`CA$${(data.total || 0).toFixed(2)}`, summaryX + 100, summaryY + 70);

// Footer
const footerY = 700;
doc.fontSize(24)
   .font('Helvetica-Bold')
   .fillColor(darkBlue)
   .text('JËR JËF', 50, footerY); // Thank you → JËR JËF

// doc.fontSize(12)
//    .font('Helvetica-Bold')
//    .fillColor(black)
//    .text('Keba Coly', 350, footerY);

doc.fontSize(10)
   .font('Helvetica')
   .fillColor(black)
   .text('CHMP', 350, footerY + 20);
}

// Helper function to generate Chinese invoice content - EXACT UI REPLICA
function generateChineseInvoiceContent(doc, data) {
  const darkBlue = '#1e3a8a';
const red = '#dc2626';
const black = '#000000';
const gray = '#6b7280';

// Header Section
doc.fontSize(32)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('发票', 50, 50); // INVOICE → 发票

// Company Info (Left)
// doc.fontSize(12)
//    .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
//    .fillColor(black)
//    .text(data.company_name || 'N/A', 50, 100)
//    .text(data.company_address || 'N/A', 50, 115)
//    .text(data.company_city || 'N/A', 50, 130);

try {
  const logoPath = path.join(__dirname, '../../../public/images/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 490, 25, { width: 80, height: 80 });
  } else {
    doc.circle(520, 65, 40)
       .fillColor('#f3f4f6')
       .fill()
       .fontSize(12)
       .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
       .fillColor(gray)
       .text('标志', 505, 60); // LOGO → 标志
  }
} catch (error) {
  doc.circle(520, 65, 40)
     .fillColor('#f3f4f6')
     .fill()
     .fontSize(12)
     .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
     .fillColor(gray)
     .text('标志', 505, 60);
}

// Invoice Details (Right)
const rightX = 350;
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue);

doc.text('发票号', rightX - 30, 110) // INVOICE # → 发票号
   .text('发票日期', rightX - 30, 140); // INVOICE DATE → 发票日期

doc.font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fontSize(10)
   .fillColor(black)
   .text(data.order_id || 'N/A', rightX + 70, 110)
   .text(data.order_date ? new Date(data.order_date).toLocaleDateString() : 'N/A', rightX + 70, 140);

// Address Sections
const addressY = 200;

// BILL TO
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('账单寄送至', 50, addressY); // BILL TO → 账单寄送至

doc.font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text(data.customer_name || 'N/A', 50, addressY + 15)
   .text(data.customer_address || 'N/A', 50, addressY + 30, {
     width: 270
   })
   .text(data.customer_city || 'N/A', 50, addressY + 55);

// SHIP TO
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('运送至', 320, addressY); // SHIP TO → 运送至

doc.font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text(data.customer_name || 'N/A', 320, addressY + 15)
   .text(data.customer_address || 'N/A', 320, addressY + 30)
   .text(data.customer_city || 'N/A', 320, addressY + 55);

// Red line separator
doc.moveTo(50, addressY + 80)
   .lineTo(550, addressY + 80)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Headers
const tableY = addressY + 90;
doc.fontSize(12)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text('数量', 50, tableY)         // QTY → 数量
   .text('产品', 120, tableY)        // PRODUCT → 产品
   .text('单价', 350, tableY)        // AMOUNT → 单价
   .text('总计', 450, tableY);       // TOTAL → 总计

// Red line under headers
doc.moveTo(50, tableY + 20)
   .lineTo(550, tableY + 20)
   .strokeColor(red)
   .lineWidth(1)
   .stroke();

// Table Items
let currentY = tableY + 30;
doc.fontSize(10)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black);

if (data.items && data.items.length > 0) {
  data.items.forEach((item) => {
    doc.text((item.qty || 0).toString(), 50, currentY)
       .text(item.description || 'N/A', 120, currentY)
       .text(`CA$${(item.unit_price || 0).toFixed(2)}`, 350, currentY)
       .text(`CA$${(item.amount || 0).toFixed(2)}`, 450, currentY);
    currentY += 20;
  });
} else {
  doc.text('0', 50, currentY)
     .text('N/A', 120, currentY)
     .text('CA$0.00', 350, currentY)
     .text('CA$0.00', 450, currentY);
  currentY += 20;
}

// Summary Section
const summaryY = currentY + 20;
const summaryX = 350;

doc.fontSize(10)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text('小计', summaryX, summaryY) // Subtotal → 小计
   .text(`CA$${(data.subtotal || 0).toFixed(2)}`, summaryX + 100, summaryY);

doc.text(`税 5%`, summaryX, summaryY + 15) // Tax → 税
   .text(`CA$${(data.tax || 0)}`, summaryX + 100, summaryY + 15);

if (data.delivery_fee && data.delivery_fee > 0) {
  doc.text('运费与小费', summaryX, summaryY + 30) // Delivery Fee & Tip → 运费与小费
     .text(`CA$${data.delivery_fee.toFixed(2)}`, summaryX + 100, summaryY + 30);
}
if (data.discount && data.discount > 0) {
  doc.text('折扣', summaryX, summaryY + 45) // Discount → 折扣
     .text(`CA$${data.discount.toFixed(2)}`, summaryX + 100, summaryY + 30);
}

// Total
doc.fontSize(14)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .text('总计', summaryX, summaryY + 70) // TOTAL → 总计
   .text(`CA$${(data.total || 0).toFixed(2)}`, summaryX + 100, summaryY + 70);

// Footer
const footerY = 700;
doc.fontSize(24)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(darkBlue)
   .text('谢谢您', 50, footerY); // Thank you → 谢谢您

// doc.fontSize(12)
//    .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
//    .fillColor(black)
//    .text('Keba Coly', 350, footerY);

doc.fontSize(10)
   .font(path.join(__dirname, "../../../fonts/NotoSansSC-Regular.ttf"))
   .fillColor(black)
   .text('CHMP', 350, footerY + 20);
} 