import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../data/models/order_model.dart';

class PdfInvoiceService {
  static Future<Uint8List> generateInvoicePdf(OrderModel order) async {
    final pdf = pw.Document();
    final dateStr = DateFormat('MMMM dd, yyyy').format(DateTime.fromMillisecondsSinceEpoch(order.timestamp));

    // Load fonts
    final fontRegular = await PdfGoogleFonts.interRegular();
    final fontBold = await PdfGoogleFonts.interBold();
    final fontBengali = await PdfGoogleFonts.notoSansBengaliRegular();

    final primaryColor = PdfColor.fromHex('#006684');
    final secondaryColor = PdfColor.fromHex('#1AB680');
    final greyColor = PdfColor.fromHex('#64748B');

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('INVOICE', 
                        style: pw.TextStyle(font: fontBold, fontSize: 28, color: primaryColor)),
                      pw.SizedBox(height: 8),
                      pw.Text('Order ID: ${order.orderId}', 
                        style: pw.TextStyle(font: fontBold, fontSize: 12, color: PdfColors.black)),
                      pw.Text('Date: $dateStr', 
                        style: pw.TextStyle(font: fontRegular, fontSize: 10, color: greyColor)),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('PET MAYA', 
                        style: pw.TextStyle(font: fontBold, fontSize: 20, color: primaryColor)),
                      pw.Text('Premium Pet Care Platform', 
                        style: pw.TextStyle(font: fontRegular, fontSize: 10, color: secondaryColor)),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 40),

              // Billing & Shipping Info
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('BILL TO:', 
                        style: pw.TextStyle(font: fontBold, fontSize: 10, color: greyColor)),
                      pw.SizedBox(height: 4),
                      pw.Text(order.userName, 
                        style: pw.TextStyle(font: fontBold, fontSize: 13)),
                      pw.Text(order.userEmail ?? order.userId, 
                        style: pw.TextStyle(font: fontRegular, fontSize: 10, color: greyColor)),
                      pw.Text(order.phone, 
                        style: pw.TextStyle(font: fontRegular, fontSize: 10, color: greyColor)),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('SHIPPING ADDRESS:', 
                        style: pw.TextStyle(font: fontBold, fontSize: 10, color: greyColor)),
                      pw.SizedBox(height: 4),
                      pw.SizedBox(
                        width: 180,
                        child: pw.Text(order.address, 
                          textAlign: pw.TextAlign.right, 
                          style: pw.TextStyle(font: fontRegular, fontSize: 10)),
                      ),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 40),

              // Items Table
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey200, width: 0.5),
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                    children: [
                      pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('ITEM DESCRIPTION', style: pw.TextStyle(font: fontBold, fontSize: 9))),
                      pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('QTY', textAlign: pw.TextAlign.center, style: pw.TextStyle(font: fontBold, fontSize: 9))),
                      pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('UNIT PRICE', textAlign: pw.TextAlign.right, style: pw.TextStyle(font: fontBold, fontSize: 9))),
                      pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('LINE TOTAL', textAlign: pw.TextAlign.right, style: pw.TextStyle(font: fontBold, fontSize: 9))),
                    ],
                  ),
                  ...order.items.map((item) => pw.TableRow(
                    children: [
                      pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text(item.product.name, style: pw.TextStyle(font: fontRegular, fontSize: 10))),
                      pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('${item.quantity}', textAlign: pw.TextAlign.center, style: pw.TextStyle(font: fontRegular, fontSize: 10))),
                      pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('৳${item.product.price.toStringAsFixed(2)}', textAlign: pw.TextAlign.right, style: pw.TextStyle(font: fontRegular, fontFallback: [fontBengali], fontSize: 10))),
                      pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('৳${item.totalPrice.toStringAsFixed(2)}', textAlign: pw.TextAlign.right, style: pw.TextStyle(font: fontRegular, fontFallback: [fontBengali], fontSize: 10))),
                    ],
                  )),
                ],
              ),
              pw.SizedBox(height: 32),

              // Summary
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      _buildSummaryRow('Subtotal', '৳${order.subtotal.toStringAsFixed(2)}', fontRegular, fontBengali),
                      pw.SizedBox(height: 4),
                      _buildSummaryRow('Shipping & Handling', '৳${order.shippingCharges.toStringAsFixed(2)}', fontRegular, fontBengali),
                      if (order.discount > 0) ...[
                        pw.SizedBox(height: 4),
                        _buildSummaryRow('Discount Applied', '- ৳${order.discount.toStringAsFixed(2)}', fontRegular, fontBengali),
                      ],
                      pw.SizedBox(height: 12),
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                        child: pw.Row(
                          mainAxisSize: pw.MainAxisSize.min,
                          children: [
                            pw.Text('TOTAL PAID:', style: pw.TextStyle(font: fontBold, fontSize: 14)),
                            pw.SizedBox(width: 32),
                            pw.Text('৳${order.total.toStringAsFixed(2)}', 
                              style: pw.TextStyle(font: fontBold, fontFallback: [fontBengali], fontSize: 16, color: primaryColor)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              pw.Spacer(),
              pw.Divider(color: PdfColors.grey300),
              pw.SizedBox(height: 12),
              pw.Center(
                child: pw.Text('Thank you for being a valued part of Pet Maya!', 
                  style: pw.TextStyle(font: fontRegular, fontSize: 10, color: greyColor)),
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  static pw.Widget _buildSummaryRow(String label, String value, pw.Font font, pw.Font fallback) {
    return pw.Row(
      mainAxisSize: pw.MainAxisSize.min,
      children: [
        pw.Text('$label:', style: pw.TextStyle(font: font, fontSize: 10, color: PdfColors.grey700)),
        pw.SizedBox(width: 24),
        pw.Text(value, style: pw.TextStyle(font: font, fontFallback: [fallback], fontSize: 10)),
      ],
    );
  }

  static Future<void> shareInvoice(OrderModel order) async {
    try {
      final pdfBytes = await generateInvoicePdf(order);
      await Printing.sharePdf(
        bytes: pdfBytes,
        filename: 'Invoice_${order.orderId}.pdf',
      );
    } catch (e) {
      debugPrint('[PdfInvoiceService] Error sharing invoice: $e');
    }
  }

  static Future<void> downloadInvoice(OrderModel order) async {
    try {
      final pdfBytes = await generateInvoicePdf(order);
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/Invoice_${order.orderId}.pdf');
      await file.writeAsBytes(pdfBytes);
    } catch (e) {
      debugPrint('[PdfInvoiceService] Error downloading invoice: $e');
    }
  }
}
