import 'package:url_launcher/url_launcher.dart';
import '../models/app_models.dart';

class SafetyService {
  static Future<void> dialEmergencyService() async {
    final Uri phoneUrl = Uri.parse("tel:191"); // Ghana Police Emergency
    if (await canLaunchUrl(phoneUrl)) {
      await launchUrl(phoneUrl);
    }
  }

  static Future<void> shareRideToWhatsApp(Ride ride) async {
    final String verificationStatus = ride.driverVerified ? "Ghana Card Verified" : "Verification Pending";
    final String carInfo = ride.carModel != null ? "${ride.carModel} (${ride.plateNumber})" : "Vehicle details pending";
    
    final String message = "I am in $carInfo driven by ${ride.driverName} ($verificationStatus). "
        "I'm commuting from ${ride.originName} to ${ride.destinationName}. "
        "Tracking link: https://commuteshare.gh/track/${ride.id}";

    final Uri whatsappUrl = Uri.parse(
      "whatsapp://send?text=${Uri.encodeComponent(message)}",
    );

    if (await canLaunchUrl(whatsappUrl)) {
      await launchUrl(whatsappUrl);
    } else {
      // Fallback to standard share or SMS
      final Uri smsUrl = Uri.parse(
        "sms:?body=${Uri.encodeComponent(message)}",
      );
      if (await canLaunchUrl(smsUrl)) {
        await launchUrl(smsUrl);
      }
    }
  }
}
