import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lottie/lottie.dart';
import '../../data/repositories/app_state_repository.dart';

class PromoContainer extends StatelessWidget {
  const PromoContainer({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final promo = state.activeUnclaimedPromo;
    
    // Don't show if no active unclaimed promo or dismissed in this session
    if (promo == null || !state.isPromoVisible) {
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: Colors.black.withValues(alpha: 0.8), // Darkened backdrop
      body: Stack(
        children: [
          // Dismiss on tapping outside the card
          GestureDetector(
            onTap: () => state.dismissPromoForSession(),
            child: Container(
              color: Colors.transparent,
              width: double.infinity,
              height: double.infinity,
            ),
          ),
          
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: ZoomIn(
                duration: const Duration(milliseconds: 400),
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 400),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2D2D2D), // Exactly matching the dark theme in image
                    borderRadius: BorderRadius.circular(48), // Highly rounded corners
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 40,
                        offset: const Offset(0, 20),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Animate illustration
                      Lottie.asset(
                        'assets/lottie/promo.json',
                        height: 160,
                        fit: BoxFit.contain,
                        repeat: true,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        promo.header,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.white.withValues(alpha: 0.9),
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${promo.discountPercent}%',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 84, // Giant percentage
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFFF05A5A), // High contrast coral/red
                          height: 1.0,
                          letterSpacing: -2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        promo.footer,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      ),
                      const SizedBox(height: 40),
                      
                      // GET IT Button
                      SizedBox(
                        width: double.infinity,
                        height: 60,
                        child: ElevatedButton(
                          onPressed: () => state.claimPromo(promo.id),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF05A5A),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'GET IT',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // NO, THANKS Button
                      GestureDetector(
                        onTap: () => state.dismissPromoForSession(),
                        child: Text(
                          'NO, THANKS',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            decoration: TextDecoration.underline,
                            color: Colors.white.withValues(alpha: 0.4),
                            letterSpacing: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
