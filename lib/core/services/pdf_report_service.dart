import 'dart:io';
import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../data/models/pet_model.dart';

class PdfReportService {
  /// Generates a high-quality clinical PDF assessment for a pet
  static Future<Uint8List> generateHealthReportPdf({
    required PetModel pet,
    required String reportTitle,
    required String reportText,
    String? providerName,
    String? date,
    String? ownerName,
  }) async {
    final pdf = pw.Document();
    final effectiveDate =
        date ?? DateFormat('yyyy-MM-dd').format(DateTime.now());
    final effectiveProvider = providerName ?? 'AI Health Diagnostic System';
    final effectiveOwner = ownerName ?? 'Pet Owner';

    // Theme Colors for PDF
    final primaryColor = PdfColor.fromHex('#006684');
    final secondaryColor = PdfColor.fromHex('#1AB680');
    final dangerColor = PdfColor.fromHex('#E53935');
    final darkTextColor = PdfColor.fromHex('#1E293B');
    final lightGreyColor = PdfColor.fromHex('#F8FAFC');
    final borderColor = PdfColor.fromHex('#E2E8F0');

    // Parse sections
    final parsedSections = _parseSectionsForPdf(reportText);
    final isUrgent =
        reportText.toLowerCase().contains('emergency') ||
        reportText.toLowerCase().contains('urgent');

    // Load fonts
    final fontRegular = await PdfGoogleFonts.interRegular();
    final fontBold = await PdfGoogleFonts.interBold();
    final fontSemiBold = await PdfGoogleFonts.interSemiBold();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(36),
        theme: pw.ThemeData.withFont(
          base: fontRegular,
          bold: fontBold,
        ),
        header: (context) => _buildPdfHeader(
          context,
          effectiveDate,
          primaryColor,
          secondaryColor,
          fontBold,
          fontRegular,
        ),
        footer: (context) => _buildPdfFooter(context, fontRegular),
        build: (context) => [
          pw.SizedBox(height: 12),

          // Pet Profile Summary Card
          _buildPetSummaryCard(
            pet: pet,
            ownerName: effectiveOwner,
            primaryColor: primaryColor,
            secondaryColor: secondaryColor,
            bgColor: lightGreyColor,
            borderColor: borderColor,
            fontBold: fontBold,
            fontSemiBold: fontSemiBold,
            fontRegular: fontRegular,
          ),

          pw.SizedBox(height: 16),

          // Assessment Overview Header & Urgency Badge
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    reportTitle,
                    style: pw.TextStyle(
                      font: fontBold,
                      fontSize: 16,
                      color: primaryColor,
                    ),
                  ),
                  pw.SizedBox(height: 2),
                  pw.Text(
                    'Assessed by $effectiveProvider',
                    style: pw.TextStyle(
                      font: fontRegular,
                      fontSize: 10,
                      color: PdfColor.fromHex('#64748B'),
                    ),
                  ),
                ],
              ),
              pw.Container(
                padding:
                    const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: pw.BoxDecoration(
                  color: isUrgent
                      ? PdfColor.fromHex('#FEE2E2')
                      : PdfColor.fromHex('#DCFCE7'),
                  borderRadius: pw.BorderRadius.circular(12),
                  border: pw.Border.all(
                    color: isUrgent ? dangerColor : secondaryColor,
                    width: 0.8,
                  ),
                ),
                child: pw.Text(
                  isUrgent ? 'URGENT ATTENTION' : 'ROUTINE MONITORING',
                  style: pw.TextStyle(
                    font: fontBold,
                    fontSize: 9,
                    color: isUrgent ? dangerColor : secondaryColor,
                  ),
                ),
              ),
            ],
          ),

          pw.SizedBox(height: 16),
          pw.Divider(color: borderColor, thickness: 0.8),
          pw.SizedBox(height: 16),

          // Render Sections
          ...parsedSections.map(
            (section) => _buildPdfSection(
              section,
              primaryColor: primaryColor,
              secondaryColor: secondaryColor,
              dangerColor: dangerColor,
              borderColor: borderColor,
              darkTextColor: darkTextColor,
              fontBold: fontBold,
              fontSemiBold: fontSemiBold,
              fontRegular: fontRegular,
            ),
          ),

          pw.SizedBox(height: 20),

          // Disclaimer Box
          pw.Container(
            padding: const pw.EdgeInsets.all(12),
            decoration: pw.BoxDecoration(
              color: PdfColor.fromHex('#FFFBEB'),
              borderRadius: pw.BorderRadius.circular(8),
              border:
                  pw.Border.all(color: PdfColor.fromHex('#FDE68A'), width: 0.8),
            ),
            child: pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  'NOTICE: ',
                  style: pw.TextStyle(
                    font: fontBold,
                    fontSize: 9,
                    color: PdfColor.fromHex('#92400E'),
                  ),
                ),
                pw.Expanded(
                  child: pw.Text(
                    'This AI health assessment is generated for guidance and triage purposes. Please consult your licensed veterinarian for professional diagnosis, lab tests, and medical prescriptions.',
                    style: pw.TextStyle(
                      font: fontRegular,
                      fontSize: 8.5,
                      color: PdfColor.fromHex('#78350F'),
                      lineSpacing: 1.2,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    return pdf.save();
  }

  /// Exports and opens the system Share sheet to send PDF to a vet or save to files
  static Future<void> shareHealthReport({
    required PetModel pet,
    required String reportTitle,
    required String reportText,
    String? providerName,
    String? date,
    String? ownerName,
  }) async {
    final pdfBytes = await generateHealthReportPdf(
      pet: pet,
      reportTitle: reportTitle,
      reportText: reportText,
      providerName: providerName,
      date: date,
      ownerName: ownerName,
    );

    final cleanPetName = pet.name.replaceAll(RegExp(r'\s+'), '_');
    final cleanDate =
        (date ?? DateFormat('yyyyMMdd').format(DateTime.now()))
            .replaceAll('-', '');
    final filename = '${cleanPetName}_Health_Assessment_$cleanDate.pdf';

    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: filename,
      subject: 'Pet Maya Health Assessment: ${pet.name}',
      body:
          'Attached is the official Pet Maya AI Health Assessment report for ${pet.name}.',
    );
  }

  /// Opens the PDF preview / print layout so the user can preview or download/print
  static Future<void> previewOrPrintHealthReport({
    required PetModel pet,
    required String reportTitle,
    required String reportText,
    String? providerName,
    String? date,
    String? ownerName,
  }) async {
    final pdfBytes = await generateHealthReportPdf(
      pet: pet,
      reportTitle: reportTitle,
      reportText: reportText,
      providerName: providerName,
      date: date,
      ownerName: ownerName,
    );

    final cleanPetName = pet.name.replaceAll(RegExp(r'\s+'), '_');
    final filename = '${cleanPetName}_Health_Assessment.pdf';

    await Printing.layoutPdf(
      name: filename,
      onLayout: (PdfPageFormat format) async => pdfBytes,
    );
  }

  /// Saves the PDF to the device's Documents folder
  static Future<String> savePdfToLocalDevice({
    required PetModel pet,
    required String reportTitle,
    required String reportText,
    String? providerName,
    String? date,
    String? ownerName,
  }) async {
    final pdfBytes = await generateHealthReportPdf(
      pet: pet,
      reportTitle: reportTitle,
      reportText: reportText,
      providerName: providerName,
      date: date,
      ownerName: ownerName,
    );

    final dir = await getApplicationDocumentsDirectory();
    final cleanPetName = pet.name.replaceAll(RegExp(r'\s+'), '_');
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final file =
        File('${dir.path}/${cleanPetName}_Health_Report_$timestamp.pdf');

    await file.writeAsBytes(pdfBytes);
    return file.path;
  }

  // --- PDF Component Builders ---

  static pw.Widget _buildPdfHeader(
    pw.Context context,
    String date,
    PdfColor primaryColor,
    PdfColor secondaryColor,
    pw.Font fontBold,
    pw.Font fontRegular,
  ) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(bottom: 12),
      decoration: const pw.BoxDecoration(
        border: pw.Border(
          bottom: pw.BorderSide(color: PdfColors.grey300, width: 0.8),
        ),
      ),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Row(
            children: [
              pw.Container(
                width: 24,
                height: 24,
                decoration: pw.BoxDecoration(
                  color: primaryColor,
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                alignment: pw.Alignment.center,
                child: pw.Text(
                  '🐾',
                  style: const pw.TextStyle(fontSize: 12),
                ),
              ),
              pw.SizedBox(width: 8),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'PET MAYA',
                    style: pw.TextStyle(
                      font: fontBold,
                      fontSize: 12,
                      color: primaryColor,
                      letterSpacing: 0.8,
                    ),
                  ),
                  pw.Text(
                    'Veterinary Health & Clinical Diagnostics',
                    style: pw.TextStyle(
                      font: fontRegular,
                      fontSize: 8,
                      color: secondaryColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
          pw.Text(
            'Date: $date',
            style: pw.TextStyle(
              font: fontRegular,
              fontSize: 9,
              color: PdfColor.fromHex('#64748B'),
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildPdfFooter(pw.Context context, pw.Font fontRegular) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(top: 8),
      decoration: const pw.BoxDecoration(
        border: pw.Border(
          top: pw.BorderSide(color: PdfColors.grey300, width: 0.5),
        ),
      ),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            'Generated by Pet Maya Care Platform',
            style: pw.TextStyle(
              font: fontRegular,
              fontSize: 8,
              color: PdfColors.grey600,
            ),
          ),
          pw.Text(
            'Page ${context.pageNumber} of ${context.pagesCount}',
            style: pw.TextStyle(
              font: fontRegular,
              fontSize: 8,
              color: PdfColors.grey600,
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildPetSummaryCard({
    required PetModel pet,
    required String ownerName,
    required PdfColor primaryColor,
    required PdfColor secondaryColor,
    required PdfColor bgColor,
    required PdfColor borderColor,
    required pw.Font fontBold,
    required pw.Font fontSemiBold,
    required pw.Font fontRegular,
  }) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: bgColor,
        borderRadius: pw.BorderRadius.circular(10),
        border: pw.Border.all(color: borderColor, width: 0.8),
      ),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  pet.name,
                  style: pw.TextStyle(
                    font: fontBold,
                    fontSize: 16,
                    color: primaryColor,
                  ),
                ),
                pw.SizedBox(height: 2),
                pw.Text(
                  '${pet.species} • ${pet.breed.isNotEmpty ? pet.breed : "Domestic"}',
                  style: pw.TextStyle(
                    font: fontSemiBold,
                    fontSize: 10,
                    color: secondaryColor,
                  ),
                ),
                pw.SizedBox(height: 4),
                pw.Text(
                  'Owner: $ownerName',
                  style: pw.TextStyle(
                    font: fontRegular,
                    fontSize: 9,
                    color: PdfColor.fromHex('#64748B'),
                  ),
                ),
              ],
            ),
          ),
          pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: pw.BoxDecoration(
              color: PdfColors.white,
              borderRadius: pw.BorderRadius.circular(6),
              border: pw.Border.all(color: borderColor, width: 0.5),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Text(
                  'Age: ${pet.age}',
                  style: pw.TextStyle(
                    font: fontRegular,
                    fontSize: 9,
                    color: PdfColors.grey800,
                  ),
                ),
                pw.SizedBox(height: 2),
                pw.Text(
                  'Weight: ${pet.weight}',
                  style: pw.TextStyle(
                    font: fontRegular,
                    fontSize: 9,
                    color: PdfColors.grey800,
                  ),
                ),
                pw.SizedBox(height: 2),
                pw.Text(
                  'Gender: ${pet.gender}',
                  style: pw.TextStyle(
                    font: fontRegular,
                    fontSize: 9,
                    color: PdfColors.grey800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildPdfSection(
    _PdfReportSection section, {
    required PdfColor primaryColor,
    required PdfColor secondaryColor,
    required PdfColor dangerColor,
    required PdfColor borderColor,
    required PdfColor darkTextColor,
    required pw.Font fontBold,
    required pw.Font fontSemiBold,
    required pw.Font fontRegular,
  }) {
    if (section.title != null) {
      final isUrgent =
          section.title!.toLowerCase().contains('urgent') ||
          section.title!.toLowerCase().contains('emergency');
      final accentColor = isUrgent ? dangerColor : primaryColor;

      return pw.Container(
        margin: const pw.EdgeInsets.only(bottom: 12),
        padding: const pw.EdgeInsets.all(10),
        decoration: pw.BoxDecoration(
          color: isUrgent
              ? PdfColor.fromHex('#FFF5F5')
              : PdfColor.fromHex('#F8FAFC'),
          borderRadius: pw.BorderRadius.circular(8),
          border: pw.Border.all(
            color: isUrgent ? PdfColor.fromHex('#FEB2B2') : borderColor,
            width: 0.8,
          ),
        ),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              section.title!,
              style: pw.TextStyle(
                font: fontBold,
                fontSize: 11,
                color: accentColor,
              ),
            ),
            if (section.paragraph != null &&
                section.paragraph!.isNotEmpty) ...[
              pw.SizedBox(height: 6),
              pw.Text(
                section.paragraph!,
                style: pw.TextStyle(
                  font: fontRegular,
                  fontSize: 9.5,
                  color: darkTextColor,
                  lineSpacing: 1.3,
                ),
              ),
            ],
            if (section.items.isNotEmpty) ...[
              pw.SizedBox(height: 6),
              ...section.items.map(
                (item) => pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 4),
                  child: pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Container(
                        width: 14,
                        height: 14,
                        alignment: pw.Alignment.center,
                        decoration: pw.BoxDecoration(
                          color: secondaryColor,
                          shape: pw.BoxShape.circle,
                        ),
                        child: pw.Text(
                          item.number ?? '•',
                          style: pw.TextStyle(
                            font: fontBold,
                            fontSize: 7.5,
                            color: PdfColors.white,
                          ),
                        ),
                      ),
                      pw.SizedBox(width: 6),
                      pw.Expanded(
                        child: pw.Text(
                          item.text,
                          style: pw.TextStyle(
                            font: fontRegular,
                            fontSize: 9.5,
                            color: darkTextColor,
                            lineSpacing: 1.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      );
    }

    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 8),
      child: pw.Text(
        section.paragraph ?? '',
        style: pw.TextStyle(
          font: fontRegular,
          fontSize: 9.5,
          color: darkTextColor,
          lineSpacing: 1.3,
        ),
      ),
    );
  }

  static List<_PdfReportSection> _parseSectionsForPdf(String rawText) {
    var text = rawText
        .replaceAll(
          RegExp(r'\*\*Empathetic Tone:\*\*', caseSensitive: false),
          '',
        )
        .replaceAll(RegExp(r'Empathetic Tone:', caseSensitive: false), '')
        .trim();

    final lines = text.split('\n');
    final List<_PdfReportSection> sections = [];
    _PdfReportSection? current;

    for (var rawLine in lines) {
      var line = rawLine.trim();
      if (line.isEmpty) continue;

      // Check for Markdown Headers: ###, ##, #
      final headerMatch = RegExp(r'^(#{1,6})\s+(.+)$').firstMatch(line);
      if (headerMatch != null) {
        final title = headerMatch
            .group(2)!
            .replaceAll(r'**', '')
            .replaceAll(r'*', '')
            .replaceAll(r':', '')
            .trim();
        current = _PdfReportSection(title: title, items: []);
        sections.add(current);
        continue;
      }

      // Check for Bold section headers
      final boldHeaderMatch =
          RegExp(r'^\*\*([A-Za-z\s&/,]+)\*\*:\s*(.*)$').firstMatch(line);
      if (boldHeaderMatch != null && boldHeaderMatch.group(2)!.isEmpty) {
        final title = boldHeaderMatch.group(1)!.trim();
        current = _PdfReportSection(title: title, items: []);
        sections.add(current);
        continue;
      }

      // Check for numbered items
      final numberedMatch = RegExp(r'^(\d+)[\.\)]\s+(.+)$').firstMatch(line);
      if (numberedMatch != null) {
        final cleanContent = numberedMatch
            .group(2)!
            .replaceAll(r'**', '')
            .replaceAll(r'*', '')
            .replaceAll(r'#', '')
            .trim();
        final item = _PdfListItem(
          number: numberedMatch.group(1),
          text: cleanContent,
        );
        if (current != null) {
          current.items.add(item);
        } else {
          current = _PdfReportSection(items: [item]);
          sections.add(current);
        }
        continue;
      }

      // Check for bullet items
      final bulletMatch = RegExp(r'^[\-\*\•]\s+(.+)$').firstMatch(line);
      if (bulletMatch != null) {
        final cleanContent = bulletMatch
            .group(1)!
            .replaceAll(r'**', '')
            .replaceAll(r'*', '')
            .replaceAll(r'#', '')
            .trim();
        final item = _PdfListItem(text: cleanContent);
        if (current != null) {
          current.items.add(item);
        } else {
          current = _PdfReportSection(items: [item]);
          sections.add(current);
        }
        continue;
      }

      final cleanParagraph = line
          .replaceAll(r'**', '')
          .replaceAll(r'*', '')
          .replaceAll(r'#', '')
          .trim();
      if (current != null &&
          current.paragraph == null &&
          current.items.isEmpty) {
        current.paragraph = cleanParagraph;
      } else {
        current = _PdfReportSection(paragraph: cleanParagraph);
        sections.add(current);
      }
    }

    return sections;
  }
}

class _PdfReportSection {
  final String? title;
  String? paragraph;
  final List<_PdfListItem> items;

  _PdfReportSection({this.title, this.paragraph, List<_PdfListItem>? items})
      : items = items ?? [];
}

class _PdfListItem {
  final String? number;
  final String text;

  _PdfListItem({this.number, required this.text});
}
