"""
generate_documentation_docx.py
Generates a comprehensive, professionally styled Word (.docx) document detailing
every module of the Pet Maya Flutter mobile application and React web application.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_document():
    doc = docx.Document()

    # Page setup - Margins (0.75 in all sides for clean executive presentation)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("PET MAYA 🐾  |  Complete System & Modules Specification")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(140, 150, 160)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        frun1 = fp.add_run("Confidential — For Internal Engineering & Product Reference")
        frun1.font.name = "Calibri"
        frun1.font.size = Pt(8.5)
        frun1.font.color.rgb = RGBColor(140, 150, 160)

    # Color Palette definitions
    PRIMARY_HEX = "0D7A72"       # Pet Maya Emerald Teal
    DARK_HEX = "1E293B"          # Slate Navy
    ACCENT_HEX = "09544E"        # Dark Emerald
    GOLD_HEX = "D97706"          # Warm Amber
    MINT_BG_HEX = "F0FDF4"       # Soft Mint fill
    LIGHT_BG_HEX = "F8FAFC"      # Subtle Slate Gray fill
    BORDER_HEX = "CBD5E1"        # Soft Gray border
    MUTED_TEXT_HEX = "64748B"    # Slate Gray text
    
    PRIMARY_RGB = RGBColor(13, 122, 114)
    DARK_RGB = RGBColor(30, 41, 59)
    GOLD_RGB = RGBColor(217, 119, 6)
    MUTED_RGB = RGBColor(100, 116, 139)

    # Helper: Set cell background
    def set_cell_bg(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

    # Helper: Set cell margins / padding
    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}>'
                          f'<w:top w:w="{top}" w:type="dxa"/>'
                          f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
                          f'<w:left w:w="{left}" w:type="dxa"/>'
                          f'<w:right w:w="{right}" w:type="dxa"/>'
                          f'</w:tcMar>')
        tcPr.append(tcMar)

    # Helper: Add Callout Box
    def add_callout(text, title=None, border_color=PRIMARY_HEX, bg_color=MINT_BG_HEX):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(6.9)
        
        cell = tbl.cell(0, 0)
        set_cell_bg(cell, bg_color)
        set_cell_margins(cell, top=160, bottom=160, left=200, right=200)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}>'
                            f'<w:top w:val="none"/>'
                            f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
                            f'<w:bottom w:val="none"/>'
                            f'<w:right w:val="none"/>'
                            f'</w:tcBorders>')
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        
        if title:
            r_title = p.add_run(f"📌 {title}\n")
            r_title.bold = True
            r_title.font.name = "Calibri"
            r_title.font.size = Pt(10.5)
            r_title.font.color.rgb = PRIMARY_RGB
            
        r_text = p.add_run(text)
        r_text.font.name = "Calibri"
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = DARK_RGB

        # Spacer after callout
        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(0)
        sp.paragraph_format.space_after = Pt(4)

    # Helper: Styled Table
    def format_table(tbl, col_widths, headers, data, align_cols=None):
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        
        # Header Row
        hdr_cells = tbl.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].width = col_widths[i]
            set_cell_bg(hdr_cells[i], PRIMARY_HEX)
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(header_text)
            r.bold = True
            r.font.name = "Calibri"
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(255, 255, 255)
            
        # Data Rows
        for row_idx, row_data in enumerate(data):
            row_cells = tbl.add_row().cells
            bg = LIGHT_BG_HEX if row_idx % 2 == 1 else "FFFFFF"
            for i, val in enumerate(row_data):
                row_cells[i].width = col_widths[i]
                set_cell_bg(row_cells[i], bg)
                set_cell_margins(row_cells[i], top=100, bottom=100, left=140, right=140)
                p = row_cells[i].paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.15
                if align_cols and i in align_cols:
                    p.alignment = align_cols[i]
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(str(val))
                r.font.name = "Calibri"
                r.font.size = Pt(9.0)
                r.font.color.rgb = DARK_RGB

        # Border styling for the table
        tblPr = tbl._tbl.tblPr
        tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}>'
                               f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{BORDER_HEX}"/>'
                               f'<w:bottom w:val="single" w:sz="12" w:space="0" w:color="{PRIMARY_HEX}"/>'
                               f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{BORDER_HEX}"/>'
                               f'<w:insideV w:val="none"/>'
                               f'<w:left w:val="none"/>'
                               f'<w:right w:val="none"/>'
                               f'</w:tblBorders>')
        tblPr.append(tblBorders)

        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(0)
        sp.paragraph_format.space_after = Pt(6)

    # Heading Helpers
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(17)
        r.bold = True
        r.font.color.rgb = PRIMARY_RGB
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(13)
        r.bold = True
        r.font.color.rgb = DARK_RGB
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(11)
        r.bold = True
        r.font.color.rgb = PRIMARY_RGB
        return p

    def add_body(text, bold_prefix=None, space_after=4):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = "Calibri"
            r_pre.font.size = Pt(10)
            r_pre.font.color.rgb = DARK_RGB
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(10)
        r.font.color.rgb = DARK_RGB
        return p

    def add_bullet(text, bold_prefix=None, level=0):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = "Calibri"
            r_pre.font.size = Pt(9.5)
            r_pre.font.color.rgb = DARK_RGB
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(9.5)
        r.font.color.rgb = DARK_RGB
        return p

    # =========================================================================
    # COVER / TITLE BLOCK
    # =========================================================================
    title_tbl = doc.add_table(rows=1, cols=1)
    title_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    title_tbl.columns[0].width = Inches(6.9)
    t_cell = title_tbl.cell(0, 0)
    set_cell_bg(t_cell, PRIMARY_HEX)
    set_cell_margins(t_cell, top=320, bottom=320, left=280, right=280)
    
    tp = t_cell.paragraphs[0]
    tp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tr1 = tp.add_run("PET MAYA 🐾\n")
    tr1.font.name = "Calibri"
    tr1.font.size = Pt(26)
    tr1.bold = True
    tr1.font.color.rgb = RGBColor(255, 255, 255)
    
    tr2 = tp.add_run("Comprehensive System & Modules Specification Manual\n")
    tr2.font.name = "Calibri"
    tr2.font.size = Pt(15)
    tr2.font.color.rgb = RGBColor(230, 245, 243)
    
    tr3 = tp.add_run("Flutter Mobile Applications & React Web Storefront / ERP Architecture\n\n")
    tr3.font.name = "Calibri"
    tr3.font.size = Pt(11)
    tr3.font.color.rgb = RGBColor(200, 235, 230)
    
    tr4 = tp.add_run("Document Version: 1.3.0 (Build 26)  |  Target Locale: Bangladesh (BDT ৳)  |  Engineered by VertexHand & Masa")
    tr4.font.name = "Calibri"
    tr4.font.size = Pt(9)
    tr4.font.color.rgb = RGBColor(180, 220, 215)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Executive Overview Callout
    add_callout(
        "Pet Maya is an integrated clinical pet care, telemetry, and commerce ecosystem built specifically for Bangladesh. "
        "The system unites multi-role mobile applications (iOS & Android via Flutter), a high-performance web presence (React 19 storefront & ERP console), "
        "serverless Cloud Functions (Node 22), and ESP32 hardware telemetry collars. This document provides a granular, module-by-module breakdown "
        "of every screen, feature, business workflow, and backend connection in the entire code repository.",
        title="Executive System Summary"
    )

    # High Level Metadata Table
    meta_headers = ["System Attribute", "Specification & Implementation"]
    meta_widths = [Inches(2.2), Inches(4.7)]
    meta_data = [
        ["Platform Ecosystem", "Flutter (iOS, Android, Desktop) + React 19 + Firebase Serverless v2 + ESP32 Firmware"],
        ["Target Market & Currency", "Bangladesh (Dhaka, Gazipur, Narayanganj cold-chain medicine delivery) | Currency: BDT (৳)"],
        ["Shared Firebase Project", "pet-maya (Unified Auth, Cloud Firestore Standard, Cloud Storage, Firebase Cloud Messaging)"],
        ["State Architecture", "Mobile: AppStateRepository (ChangeNotifier / Provider) | Web: Context + Custom Store / Router"],
        ["AI Diagnostic Core", "OpenAI GPT-4o Vision & Triage proxied via Cloud Functions Callable (Zero client API leakage)"],
        ["IoT Hardware Trackers", "PlatformIO ESP32 (Wi-Fi, LoRa 433/868/915 MHz, GPS GNSS receiver, HMAC-SHA256 signed packets)"],
        ["ERP Staff Permissions", "Granular RBAC: Manager (*), Cashier, Pharmacist, Accountant, Storekeeper, Master Admin"]
    ]
    format_table(doc.add_table(rows=1, cols=2), meta_widths, meta_headers, meta_data)

    # =========================================================================
    # PART 1: FLUTTER MOBILE APP MODULES (lib/)
    # =========================================================================
    add_h1("1. Flutter Mobile Application Architecture (lib/)")
    add_body(
        "The Flutter mobile codebase powers seven distinct user personas (Pet Owners, Veterinarians, Groomers, Boarding Facilities, Shelters, Pet Shops, and System Administrators). "
        "All client operations revolve around a single reactive state repository (AppStateRepository) backed by real-time Firestore snapshots and local offline SQLite/preferences persistence."
    )

    # 1.1 Auth & Onboarding Module
    add_h2("1.1 Authentication & Onboarding Module (lib/presentation/auth/)")
    add_body("Handles session persistence, security checks, progressive onboarding, and role-based entry dispatching.")
    
    auth_headers = ["Screen / Component", "File Path", "Functional & Technical Workflow"]
    auth_widths = [Inches(1.8), Inches(1.8), Inches(3.3)]
    auth_data = [
        [
            "SplashScreen",
            "lib/presentation/auth/splash_screen.dart",
            "Initial landing screen. Initializes Firebase App Check (Play Integrity on Android release), loads .env secrets, starts LocalCacheService and HomeWidgetService. Checks active user session via AppStateRepository and routes user according to UserRole."
        ],
        [
            "OnboardingScreen",
            "lib/presentation/auth/onboarding_screen.dart",
            "Engaging 3-step carousel introducing digital medical passports, AI symptom diagnostics, and GPS collar tracking with smooth micro-animations (animate_do)."
        ],
        [
            "LoginScreen",
            "lib/presentation/auth/login_screen.dart",
            "Provides dual-mode authentication via Firebase Auth: Email/Password and Google Sign-In with OAuth credential linking. Includes forgot password reset link dispatch."
        ],
        [
            "RegisterScreen",
            "lib/presentation/auth/register_screen.dart",
            "Multi-role account registration allowing new users to select their profile role (Pet Owner, Veterinarian, Pet Shop, Grooming/Boarding service) and creating initial users/{uid} documents."
        ]
    ]
    format_table(doc.add_table(rows=1, cols=3), auth_widths, auth_headers, auth_data)

    # 1.2 Pet Owner Core Home & Navigation
    add_h2("1.2 Pet Owner Core Home & Navigation (lib/presentation/owner/home/)")
    add_body("The primary command center for pet parents, featuring quick access to medical status, daily care reminders, and emergency tools.")
    
    home_headers = ["Screen / Component", "Key Features & Capabilities", "Technical Highlight"]
    home_widths = [Inches(1.8), Inches(2.8), Inches(2.3)]
    home_data = [
        [
            "OwnerHomeScreen",
            "Displays interactive Bento cards for active pets, pending vaccine boosters, quick SOS emergency trigger, upcoming vet consultations, and curated pet shop items.",
            "Listens to AppStateRepository stream for real-time pet status and dynamic unread notification badges."
        ],
        [
            "HeroPetCarousel",
            "Smooth horizontal pet selector displaying pet photo, species badge, age, weight, and quick switch toggle for active pet context.",
            "Synchronizes with HomeWidgetService to update the native Android home screen widget with the active pet."
        ],
        [
            "NotificationScreen",
            "Central notification centre displaying vaccine reminders, order status updates, and broadcast announcements.",
            "Dual schema reader: handles both server/web documents and Flutter app push notification objects gracefully."
        ],
        [
            "PetTrackerScreen",
            "Full-screen Google Maps radar interface rendering current GPS coordinates, geofence radius circle, battery gauge, and signal RSSI.",
            "Integrates Vector Map Engine (GoogleMapsFlutterAndroid) with hardware GPS coordinates from devices collection."
        ],
        [
            "UserProfileScreen & EditProfileScreen",
            "Profile management for pet owners: contact information, emergency phone, Dhaka district address, and notification preferences.",
            "Direct write to users/{uid} with on-device image compression before uploading to Firebase Storage."
        ]
    ]
    format_table(doc.add_table(rows=1, cols=3), home_widths, home_headers, home_data)

    # 1.3 Digital Health Vault & AI Scanner
    add_h2("1.3 Digital Health Vault & AI Health Scanner (lib/presentation/owner/pets/)")
    add_body("An advanced digital health record vault, vaccination manager, and camera-based vision AI symptom analyzer.")

    add_bullet("PetDetailsScreen & AddEditPetScreen: Comprehensive pet profiles recording breed, date of birth, gender, weight trajectory, microchip ID, and spay/neuter status.", "Pet Profile Vault: ")
    add_bullet("PetPassportScreen: Generates an official, printable and scannable digital pet passport containing full immunization history, owner contact, and verified doctor stamps.", "Digital Passport: ")
    add_bullet("PassportQrScanner: Mobile QR code scanner allowing veterinary clinics to quickly scan a pet's collar/passport and retrieve historical medical records in emergency situations.", "QR Code Scanner: ")
    add_bullet("AiHealthScannerScreen: Users photograph visible symptoms (skin rash, eye discharge, ear infection, wound). Sends base64 sanitized image to Cloud Functions openai_proxy for structured GPT-4o clinical triage analysis.", "Vision AI Scanner: ")
    add_bullet("PetHealthTrackerScreen & VaccinationScreen: Interactive timeline tracking rabies, DHPP, FVRCP vaccinations, automatic calculation of booster due dates, and PDF certificate export.", "Vaccines & Vitals: ")
    add_bullet("BreedFinderScreen: Computer vision breed identifier capable of determining dog and cat breeds from phone camera shots.", "Breed Classifier: ")
    add_bullet("PetFoodScreen: Tailored dietary guides, daily caloric requirement calculators, and feeding schedules based on age, weight, and activity level.", "Nutrition Advisor: ")

    add_callout(
        "Species Normalization Rule: Due to legacy data ingestion, pets in Firestore are often saved with type: 'Dog' regardless of reality. "
        "The Flutter app enforces PetModel.resolvedSpecies (and species.js on the web) which applies strict breed-based heuristic matching "
        "to ensure cats (Persian, Siamese, etc.), birds, and exotics are accurately categorized.",
        title="Critical Data Gotcha: Species Resolution"
    )

    # 1.4 Veterinary & Services Marketplace
    add_h2("1.4 Veterinary & Services Marketplace (lib/presentation/owner/services/)")
    add_body("A trusted booking platform connecting pet owners with certified Bangladeshi veterinary clinics, groomers, and boarding facilities.")

    services_headers = ["Screen", "Purpose", "Workflow"]
    services_widths = [Inches(1.8), Inches(2.2), Inches(2.9)]
    services_data = [
        [
            "PetServicesScreen",
            "Categorized service directory",
            "Filters verified providers across General Medicine, Surgery, Vaccination, Grooming, Boarding, and Shelter adoption."
        ],
        [
            "VetDetailsScreen",
            "Practitioner credentials & clinic profile",
            "Displays PMDC / DVM licensing status, clinical practice hours, consultation fees in BDT, clinic address map, and verified reviews."
        ],
        [
            "BookingScreen",
            "Appointment reservation flow",
            "Selects pet, appointment type (clinic visit vs home consultation), available time slots, symptom description, and locks calendar slot."
        ],
        [
            "MyAppointmentsScreen",
            "Appointment lifecycle tracker",
            "Lists upcoming, completed, and cancelled bookings with real-time status updates from the service_records collection."
        ],
        [
            "ReviewsScreen",
            "100% verified review engine",
            "Allows owners who attended completed appointments to submit star ratings and detailed clinical service feedback."
        ]
    ]
    format_table(doc.add_table(rows=1, cols=3), services_widths, services_headers, services_data)

    # 1.5 Care E-Commerce Shop
    add_h2("1.5 Care E-Commerce Shop Module (lib/presentation/owner/shop/)")
    add_body("Mobile storefront for purchasing certified medicines, prescription diets, accessories, and pet hygiene products.")

    add_bullet("ShopScreen: Multi-category e-commerce experience with species-aware filtering (dog, cat, birds), price range sliders, instant search, and stock status indicators.", "Product Catalog: ")
    add_bullet("ProductDetailsScreen: High-resolution image gallery (cover, gallery, full view), variant picker (size, flavor, pack count), course pack discount calculation, and Rx prescription alert badges.", "Product Detail: ")
    add_bullet("CartScreen: Quantity counters, coupon discount input, auto-calculation of item subtotals, and delivery charges.", "Shopping Bag: ")
    add_bullet("CheckoutScreen: Address input with automated cold-chain validation (medicines requiring refrigeration are restricted to Dhaka, Gazipur, and Narayanganj). Supports Cash on Delivery and digital payment integrations.", "Compliant Checkout: ")
    add_bullet("OrdersScreen & OrderDetailsScreen: Visual order progression stepper (Pending -> Processing -> Dispatched -> Delivered | Cancelled), invoice summary, courier tracking, and re-order button.", "Order Tracking: ")

    # 1.6 Community, Social Feed & Blog
    add_h2("1.6 Community Feed, Social & Blog Journal (lib/presentation/owner/community/)")
    add_body("Fosters a compassionate pet community in Bangladesh for sharing milestones, arranging adoptions, and reporting lost pets.")
    add_bullet("CommunityFeedScreen: Real-time social feed with photo posts, adoption requests, lost & found emergencies, and milestone badges.", "Social Wall: ")
    add_bullet("CreatePostScreen: User-generated content creator supporting multi-image selection with automatic on-device compression (flutter_image_compress) and location tagging.", "Post Composer: ")
    add_bullet("CommentsBottomSheet & ReactionsListBottomSheet: Dynamic engagement components supporting instant comments, replies, and animated reactions (love, cheer, care).", "Interactions: ")
    add_bullet("BlogScreen & BlogDetailScreen: Editorial articles written by veterinary professionals covering monsoon pet health, heatstroke prevention, and puppy socialization in Dhaka.", "Pet Care Journal: ")

    # 1.7 IoT Pet Tracker & Hardware Integration
    add_h2("1.7 IoT Pet Tracker & Hardware Integration (lib/presentation/owner/devices/)")
    add_body("Integrates the Flutter app with custom hardware pet collars engineered by Pet Maya.")
    add_bullet("MyDevicesScreen: Paired device dashboard displaying battery level percentage, signal quality (RSSI), active GPS fix, and telemetry mode (Live Radar vs Power-Save).", "Hardware Hub: ")
    add_bullet("LoraFinderScreen: Directional radio finder tool communicating with handheld LoRa finders via Bluetooth BLE (flutter_reactive_ble) to locate pets in dense urban areas without cellular reception.", "LoRa Radio Radar: ")
    add_bullet("AlarmHelper.java (MethodChannel com.masa.petmaya/native_bridge): Schedules native Android AlarmManager exact alarms with FLAG_IMMUTABLE PendingIntents to guarantee medication alerts fire even in deep Doze mode.", "Native Alarm Bridge: ")

    # 1.8 Provider & Veterinarian Portal
    add_h2("1.8 Service Provider & Veterinarian Portal (lib/presentation/provider/)")
    add_body("Dedicated clinical interface for licensed vets and service specialists.")
    add_bullet("VetDashboardScreen: Overview of daily consultations, waiting room queue, completed visits, and monthly consultation earnings in BDT.", "Clinical Dashboard: ")
    add_bullet("ClientListScreen: Patient index allowing doctors to view pet medical vault history, previous vaccinations, and diagnostic test results.", "Patient Directory: ")
    add_bullet("AddServiceRecordModal: Clinical record creation tool: allows veterinarians to input vital signs, diagnosis, digital prescriptions, and next booster recommendation.", "Prescription & Records: ")
    add_bullet("EditPracticeHoursModal: Configures recurring practice hours, vacation closures, and slot intervals.", "Schedule Manager: ")

    # 1.9 Merchant & Pet Shop Portal
    add_h2("1.9 Merchant & Pet Shop Portal (lib/presentation/merchant/)")
    add_body("Tailored for physical pet shops and online distributors partnering with Pet Maya.")
    add_bullet("PetShopDashboardScreen: Tracks pending orders, daily sales volume, low stock alerts, and settlement balances.", "Shop Overview: ")
    add_bullet("InventoryManagementScreen: In-app catalog browser to toggle product availability, update physical stock counts, and adjust retail pricing.", "Stock Control: ")
    add_bullet("ShopOrdersScreen: Order fulfillment workflow: accepts incoming delivery requests, prints packing slips, and marks packages ready for courier dispatch.", "Order Dispatch: ")

    # 1.10 Master Administration Module
    add_h2("1.10 Master Mobile Administration Module (lib/presentation/admin/)")
    add_body("Mobile admin command console for platform administrators.")
    add_bullet("AdminDashboardScreen: High-level overview of active users, new pet registrations, marketplace gross merchandise value (GMV), and system health.", "Admin Overview: ")
    add_bullet("AdminVerifyVetsScreen: Scrutinizes submitted veterinary degrees and clinical licenses before granting verified practitioner badges.", "Credential Verification: ")
    add_bullet("AdminBroadcastScreen: Dispatches real-time Firebase Cloud Messaging (FCM) topic broadcast notifications to target groups (All Users, Pet Owners, Veterinarians, Pet Shops).", "Broadcast Push: ")
    add_bullet("AdminOrderManagerScreen & AdminShopManagerScreen: Storewide order resolution, price mismatch overrides, and dispute moderation.", "Commerce Control: ")
    add_bullet("AdminBlogManagerScreen, AdminLogsScreen & SuperAdminSettingsModal: CMS article moderation, administrative audit logs, and global feature toggles.", "System Governance: ")

    # 1.11 Common UI Widgets & Design System
    add_h2("1.11 Core Foundation & Design System (lib/presentation/common_widgets/)")
    add_body("A cohesive, premium clinical design system crafted for high contrast, responsiveness, and aesthetic appeal.")
    add_bullet("GlassScaffold & GlassCard: Sophisticated frosted-glass aesthetic (BackdropFilter) supporting seamless light and dark mode transitions.", "Glassmorphism: ")
    add_bullet("BentoCard & PremiumCard: Modular dashboard container styling inspired by modern clinical interfaces with subtle borders and shadows.", "Bento Grid: ")
    add_bullet("FloatingNavbar: Custom floating navigation pill with animated icons and micro-interactions.", "Navigation Pill: ")
    add_bullet("FormattedAiReport: Clinical markdown parser styling AI diagnostic responses with urgency badges (Low, Medium, Critical Emergency) and action checklists.", "AI Report Styler: ")
    add_bullet("Responsive (lib/core/responsive.dart): Cross-platform layout engine that locks phones in portrait mode while intelligently adapting tablets, foldables, and desktop windows into multi-column bento grids.", "Responsive Engine: ")

    # =========================================================================
    # PART 2: REACT WEB APPLICATION MODULES (web/src/)
    # =========================================================================
    add_h1("2. React Web Application Architecture (web/)")
    add_body(
        "Built with React 19 and Vite 6, the web application serves a dual purpose: a public consumer storefront (site/) "
        "and a comprehensive ERP and Point-of-Sale console (admin/). It uses a custom high-performance router (lib/router.jsx) "
        "without external heavy routing libraries, ensuring near-instant page transitions and optimized bundle splitting."
    )

    # 2.1 Public Storefront Pages
    add_h2("2.1 Public Storefront Pages (web/src/site/pages/)")
    add_body("Customer-facing web portal delivering a clinical e-commerce, triage, and educational experience.")

    web_headers = ["Route & Page", "File Path", "Architecture & Functional Description"]
    web_widths = [Inches(1.8), Inches(1.8), Inches(3.3)]
    web_data = [
        [
            "/ (Home)",
            "web/src/site/pages/Home.jsx",
            "Storefront landing page: dynamic hero banner, pet type quick selector, curated bestseller carousel, AI symptom triage teaser, cold-chain assurance badges, verified customer testimonials, and quick links to Dhaka emergency vets."
        ],
        [
            "/shop & /shop/:category",
            "web/src/site/pages/Shop.jsx",
            "Full e-commerce catalog supporting hierarchical category tree navigation (lib/categories.js), species filter matching (dogs, cats, birds), price range filters, brand facets, instant search, and stock status indicators."
        ],
        [
            "/product/:slug/:id",
            "web/src/site/pages/Product.jsx",
            "Product detail experience: multi-angle photo gallery, variant pricing (sale, regular, cost), course pack discounts (3-pack save 3%, 6-pack save 5%), auto-refill subscriptions (5% discount), prescription requirement flags, and verified reviews."
        ],
        [
            "/checkout",
            "web/src/site/pages/Checkout.jsx",
            "Streamlined checkout supporting both registered and guest users. Integrates district validation for temperature-sensitive biologics (cold-chain delivery restricted to Dhaka, Gazipur, Narayanganj), coupon codes, and order note capture."
        ],
        [
            "/account/orders/:id",
            "web/src/site/pages/OrderTracking.jsx",
            "Public order tracking page using real-time Firestore snapshots. Displays timeline stages: Rx review -> Packing -> In transit -> Delivered. Allows customers to initiate returns or cancellations within permissible windows."
        ],
        [
            "/specialists",
            "web/src/site/pages/Specialists.jsx",
            "Veterinary specialist directory with location search (Dhanmondi, Gulshan, Uttara, Mirpur). Features doctor profile modals and integrated consultation booking (BookingModal.jsx)."
        ],
        [
            "/triage",
            "web/src/site/pages/Triage.jsx",
            "Interactive web symptom checker. Users choose symptom categories and optionally attach clear photos (sanitized and validated client-side). Proxied to OpenAI via Cloud Functions for instant guidance."
        ],
        [
            "/halo",
            "web/src/site/pages/Halo.jsx",
            "Interactive product landing page for the Maya Halo GPS collar. Features an interactive 3D WebGL collar model rendered via Three.js (HaloBreakdown.jsx) with real-time material shaders."
        ],
        [
            "/gps",
            "web/src/site/pages/Gps.jsx",
            "Web radar tracker rendering pet locations on interactive maps with geofence boundary visualizers and device health telemetry."
        ],
        [
            "/vault, /dashboard & /pets/:id",
            "web/src/site/pages/Vault.jsx, PetDashboard.jsx, PetProfile.jsx",
            "Web-based Digital Health Vault allowing pet parents to manage vaccination certificates, weight charts, and medical document uploads from desktop browsers."
        ],
        [
            "/community & /journal",
            "web/src/site/pages/Community.jsx, Journal.jsx",
            "Community forum and pet lifestyle blog. High SEO optimization with pre-rendered Open Graph tags and clean slug URLs."
        ],
        [
            "/signin",
            "web/src/site/pages/SignIn.jsx",
            "Web authentication gateway with Google Sign-In popup and email credential authentication."
        ]
    ]
    format_table(doc.add_table(rows=1, cols=3), web_widths, web_headers, web_data)

    # 2.2 Storefront Floating Components
    add_h2("2.2 Storefront Shared & Floating Components (web/src/site/)")
    add_body("Crucial persistent utilities that elevate the user experience across all storefront pages.")
    add_bullet("BagDrawer.jsx: Quick slide-out shopping drawer allowing customers to review items, alter quantities, apply promo codes, and proceed to checkout without full page reload.", "Slide-out Cart: ")
    add_bullet("CompareDrawer.jsx: Side-by-side product comparison tray evaluating ingredients, pack sizes, nutritional guarantees, and prices per unit.", "Product Comparator: ")
    add_bullet("AiShoppingAssistant.jsx: Floating conversational AI pet care helper guiding pet owners to relevant diets, tick medications, and supplements.", "AI Shopping Concierge: ")
    add_bullet("AnnouncementBar.jsx: Dynamic site-wide ticker displaying shipping updates, emergency notices, or sale countdowns with customizable colors and start/end dates.", "Announcement Banner: ")
    add_bullet("ConsentBar.jsx: Privacy and cookie consent bar synchronizing consent flags with Google Tag Manager and Meta Pixel before loading tracking scripts.", "Consent Management: ")

    # 2.3 Admin & ERP Operations Console
    add_h2("2.3 Admin & ERP Operations Console (web/src/admin/)")
    add_body(
        "Accessible at /admin or on the admin.petmaya.app subdomain, this comprehensive enterprise resource planning system "
        "empowers store managers, pharmacists, cashiers, and accountants to manage omnichannel commerce."
    )

    admin_headers = ["ERP Module", "File Path", "Operational Capabilities"]
    admin_widths = [Inches(1.8), Inches(1.8), Inches(3.3)]
    admin_data = [
        [
            "Executive Dashboard",
            "web/src/admin/pages/Dashboard.jsx",
            "Live analytics: Gross Merchandise Value (GMV), net revenue, daily order volumes, gross margin percentages, low stock alerts, and pending prescription approvals."
        ],
        [
            "Order Fulfillment Engine",
            "web/src/admin/pages/Orders.jsx & OrderDetail.jsx",
            "Processes incoming orders across lifecycle stages (Rx review -> Packing -> In transit -> Delivered). Features printable thermal packing slips and courier dispatch manifests."
        ],
        [
            "Point of Sale (POS)",
            "web/src/admin/pages/POS.jsx",
            "High-speed retail counter POS interface. Features instant SKU/barcode lookup, camera/hardware barcode scanning, cash and bKash digital payment logging, and 80mm thermal receipt printing."
        ],
        [
            "Catalog & Variants",
            "web/src/admin/pages/Products.jsx & AddProduct.jsx",
            "Product management with multi-tier pricing (sale, regular, and cost of goods sold), variant options (weight, color, pack count), CSV bulk export/import, and 3-way photo syncing (web/app)."
        ],
        [
            "Category Tree Manager",
            "web/src/admin/pages/Categories.jsx & categoryOps.js",
            "Hierarchical product category manager of unlimited depth. Supports drag-and-drop reordering, slug uniqueness validation, and automated path re-rooting updates across products."
        ],
        [
            "Prescription Verification",
            "web/src/admin/pages/Prescriptions.jsx",
            "Dedicated pharmaceutical verification queue for licensed pharmacists to inspect and approve vet prescription uploads before dispatching controlled pet drugs."
        ],
        [
            "Stock & Inventory Movements",
            "web/src/admin/pages/Stock.jsx & Inventory.jsx",
            "Full warehouse ledger recording every inventory adjustment, automated deductions upon checkout, restocking entries, and stock move audit logs (stock_moves collection)."
        ],
        [
            "Purchasing & Vendors",
            "web/src/admin/pages/Purchasing.jsx",
            "Manages pet product suppliers, vendor catalogs, purchase orders (POs), and goods received notes (GRN) with cost tracking."
        ],
        [
            "Financials & Accounting",
            "web/src/admin/pages/Finance.jsx, Sales.jsx, Reports.jsx",
            "Double-entry bookkeeping, daily expense categorization (clinic supplies, courier fees, rent), profit & loss statements, and cashier shift balance reconciliation."
        ],
        [
            "Staff & Role-Based Access",
            "web/src/admin/pages/Staff.jsx & erp.js",
            "Administers staff accounts and granular roles: Manager (*), Cashier (POS), Pharmacist (Rx & Medicines), Accountant (Financials), and Storekeeper (Inventory)."
        ],
        [
            "Promotions & Announcements",
            "web/src/admin/pages/Promotions.jsx & Announcement.jsx",
            "Configures coupon rules (first-order discounts, percentage vs flat BDT off, minimum order totals) and edits the global storefront top banner."
        ]
    ]
    format_table(doc.add_table(rows=1, cols=3), admin_widths, admin_headers, admin_data)

    # =========================================================================
    # PART 3: CLOUD FUNCTIONS & BACKEND
    # =========================================================================
    add_h1("3. Cloud Functions Backend & Services (functions/src/)")
    add_body(
        "The serverless backend runs on Node 22 using Firebase Functions v2. It provides idempotent transaction execution, "
        "isolated AI gateways, IoT telemetry ingestion, and server-side marketing attribution."
    )

    func_headers = ["Function Name", "Trigger Type", "Critical Architectural Responsibility"]
    func_widths = [Inches(1.8), Inches(1.3), Inches(3.8)]
    func_data = [
        [
            "create_order",
            "Callable HTTPS",
            "The authoritative order creation pipeline for the website. Runs inside a Firestore transaction: re-computes true prices from products catalog, checks and deducts stock, validates coupons, generates sequential order numbers, and reserves ID in order_ids."
        ],
        [
            "openai_proxy",
            "Callable HTTPS",
            "Secure AI proxy guarding the OPENAI_API_KEY secret. Rate-limits users (20 requests/10 min, 100/day), sanitizes input lengths, validates base64 image formats (JPEG/PNG/WebP), and executes GPT-4o analysis for triage and nutrition."
        ],
        [
            "device_ingest & lora_ingest",
            "HTTPS Webhook",
            "Collects hardware GPS coordinates from Wi-Fi collars and LoRa gateways. Validates cryptographic HMAC-SHA256 packet signatures using DEVICE_MASTER_SECRET, updates device positions, and triggers geofence exit push alerts."
        ],
        [
            "push_on_notification",
            "Firestore Trigger",
            "Listens to notifications/{uid}/items documents. Sends FCM push notifications to user mobile tokens while enforcing an anti-repeat throttle to prevent notification spam loops."
        ],
        [
            "feed",
            "HTTPS Request",
            "Dynamically generates compliant Google Shopping and Meta Catalog XML feeds (/feeds/meta.xml, /feeds/google.xml) directly from active inventory, excluding Rx-only medications."
        ],
        [
            "track_purchase & collect",
            "HTTPS Request",
            "Dispatches server-side purchase telemetry to Google Analytics 4 (Measurement Protocol) and Meta Conversions API (CAPI) / Server GTM with SHA256 hashed customer parameters."
        ]
    ]
    format_table(doc.add_table(rows=1, cols=3), func_widths, func_headers, func_data)

    # =========================================================================
    # PART 4: SECURITY RULES & DATA GOVERNANCE
    # =========================================================================
    add_h1("4. Security Architecture & Rules (firestore.rules, storage.rules)")
    add_body(
        "Access control adheres to a zero-trust, deny-by-default architecture. Security rules strictly enforce ownership "
        "boundaries, protect user PII, and restrict ERP management to authorized staff roles."
    )

    sec_headers = ["Collection", "Public Read", "Owner Read/Write", "Staff / Admin Privilege"]
    sec_widths = [Inches(1.5), Inches(1.2), Inches(2.2), Inches(2.0)]
    sec_data = [
        ["users/{uid}", "No", "Owner read & write (restricted profile fields)", "Admin write (verification & suspension)"],
        ["pets/{petId}", "No", "Owner read & write tied to ownerID", "Verified providers read; Admin full"],
        ["products/{id}", "Yes (Active only)", "None (Clients cannot write products)", "Manager, Storekeeper, Pharmacist write"],
        ["orders/{orderId}", "No", "Owner read; web writes via create_order", "Staff (Manager, Cashier, Pharmacist) full"],
        ["categories/{id}", "Yes", "None (Catalog read-only for public)", "Manager and Master Admin write"],
        ["devices/{devId}", "No", "Owner read & write tied to ownerId", "IoT backend (Admin SDK) updates location"],
        ["service_records/{id}", "No", "Pet owner read-only", "Verified attending Vet write; Admin read"],
        ["erp_* (finances)", "No", "None (Completely closed to consumers)", "Restricted by staffRole (Accountant, Manager)"]
    ]
    format_table(doc.add_table(rows=1, cols=4), sec_widths, sec_headers, sec_data)

    # =========================================================================
    # PART 5: FIRMWARE & HARDWARE TELEMETRY
    # =========================================================================
    add_h1("5. Hardware Firmware Ecosystem (firmware/)")
    add_body(
        "Pet Maya engineers proprietary smart hardware trackers for pet security in urban Bangladesh where GPS multipath and cellular dead zones occur."
    )
    add_bullet("firmware/wifi-collar: ESP32-based collar module equipped with GNSS GPS receiver and Wi-Fi triangulation for domestic environments.", "Wi-Fi Pet Collar: ")
    add_bullet("firmware/lora-tracker: Ultra-low power collar utilizing LoRa (Long Range) sub-GHz radio (433/868/915 MHz) transmitting encrypted telemetry packets across 5-10 km distances.", "LoRa Pet Tracker: ")
    add_bullet("firmware/lora-gateway: Stationary receiver station that listens for pet collar beacons and forwards telemetry to the device_ingest Cloud Function via MQTT/HTTPS.", "LoRa Gateway: ")
    add_bullet("firmware/lora-finder: Handheld hunter device with directional antenna and BLE connectivity to the mobile app (LoraFinderScreen) for visual lost pet recovery.", "Handheld LoRa Finder: ")

    # =========================================================================
    # PART 6: TESTING, BUILD & VERSIONING
    # =========================================================================
    add_h1("6. Quality Assurance, Build & Deployment Standards")
    add_body("The repository maintains automated test coverage across JavaScript unit logic, Cloud Functions, and Flutter platform components.")

    qa_headers = ["Test Suite / Pipeline", "Command", "Scope & Verified Results"]
    qa_widths = [Inches(2.0), Inches(2.2), Inches(2.7)]
    qa_data = [
        [
            "Pure Unit Tests (Node 22)",
            "node --test tests/unit/*.test.mjs",
            "49 / 49 Passed: Validates category tree hierarchy, variant pricing math, species resolution heuristics, announcement rules, and product form sanitation."
        ],
        [
            "Cloud Functions Tests",
            "npm test (in functions/)",
            "47 / 47 Passed: Validates create_order checkout arithmetic, cold-chain zoning, LoRa packet decryption, XML feed generation, and rate limiters."
        ],
        [
            "Flutter Unit Tests",
            "flutter test test/pet_species_test.dart ...",
            "11 / 11 Passed: Validates mobile responsive layout engine, upload validators, and breed-to-species heuristic matching."
        ],
        [
            "Web Production Build",
            "npm run build (in web/)",
            "Success: Compiles React 19 storefront and admin console into web/dist in ~11 seconds using Vite 6."
        ],
        [
            "Unified Versioning",
            "node tools/set-version.mjs <ver> <build>",
            "Synchronizes version across pubspec.yaml, app_info.dart, and web/package.json simultaneously."
        ]
    ]
    format_table(doc.add_table(rows=1, cols=3), qa_widths, qa_headers, qa_data)

    # Concluding Sign-off Callout
    add_callout(
        "This specification is continuously updated in sync with repository milestones. "
        "Any modifications to shared Firestore schemas, Cloud Function callables, or responsive layout guidelines "
        "must be reflected across both the Flutter and React codebases to maintain platform equilibrium.",
        title="Document Governance & Maintenance"
    )

    output_path = os.path.abspath("Pet_Maya_System_Modules_Overview.docx")
    doc.save(output_path)
    print(f"Successfully generated executive Word document at: {output_path}")

if __name__ == "__main__":
    create_document()
