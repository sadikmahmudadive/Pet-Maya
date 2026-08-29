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

    return Container(
      color: Colors.black.withValues(alpha: 0.75), // Dim background
      width: double.infinity,
      height: double.infinity,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40),
          child: FadeInUp(
            duration: const Duration(milliseconds: 500),
            child: Material(
              color: Colors.transparent,
              child: Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: const Color(0xFF2D2D2D), // Dark gray card as per design
                  borderRadius: BorderRadius.circular(40),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 30,
                      offset: const Offset(0, 15),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Animation Illustration
                    Lottie.asset(
                      'assets/lottie/promo.json',
                      height: 180,
                      fit: BoxFit.contain,
                      repeat: true,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      promo.header.toUpperCase(),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Colors.white60,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${promo.discountPercent}%',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 72,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFFF05A5A), // Matches the "Red" in design
                        height: 0.9,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      promo.footer,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 58,
                      child: ElevatedButton(
                        onPressed: () => state.claimPromo(promo.id),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF05A5A),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'GET IT',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                            fontSize: 15,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: () => state.dismissPromoForSession(),
                      child: Text(
                        'NO, THANKS',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          decoration: TextDecoration.underline,
                          color: Colors.white38,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
