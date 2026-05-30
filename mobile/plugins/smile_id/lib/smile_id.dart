import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import 'generated/smileid_messages.g.dart';
import 'smile_id_service.dart';

export 'generated/smileid_messages.g.dart';
export 'products/biometric/smile_id_biometric_kyc.dart';
export 'products/capture/smile_id_document_capture_view.dart';
export 'products/capture/smile_id_smart_selfie_capture_view.dart';
export 'products/document/smile_id_document_verification.dart';
export 'products/enhanceddocv/smile_id_enhanced_document_verification.dart';
export 'products/enhancedselfie/smile_id_smart_selfie_authentication_enhanced.dart';
export 'products/enhancedselfie/smile_id_smart_selfie_enrollment_enhanced.dart';
export 'products/models/model.dart';
export 'products/selfie/smile_id_smart_selfie_authentication.dart';
export 'products/selfie/smile_id_smart_selfie_enrollment.dart';

class SmileID {
  @visibleForTesting
  static SmileIDApi platformInterface = SmileIDApi();
  static SmileIDService api = SmileIDService(platformInterface);

  static void initializeWithApiKey(
      {required String apiKey,
      required FlutterConfig config,
      required bool useSandbox,
      required bool enableCrashReporting}) {
    platformInterface.initializeWithApiKey(
        apiKey, config, useSandbox, enableCrashReporting);
  }

  static void initializeWithConfig(
      {required FlutterConfig config,
      required bool useSandbox,
      required bool enableCrashReporting}) {
    platformInterface.initializeWithConfig(
        config, useSandbox, enableCrashReporting);
  }

  static void initialize(
      {required bool useSandbox, required bool enableCrashReporting}) {
    platformInterface.initialize(useSandbox, enableCrashReporting);
  }

  static void setCallbackUrl({required Uri callbackUrl}) {
    platformInterface.setCallbackUrl(callbackUrl.toString());
  }

  static void setAllowOfflineMode({required bool allowOfflineMode}) {
    platformInterface.setAllowOfflineMode(allowOfflineMode);
  }

  Future<List<String?>> getSubmittedJobs() {
    return platformInterface.getSubmittedJobs();
  }

  Future<List<String?>> getUnsubmittedJobs() {
    return platformInterface.getUnsubmittedJobs();
  }

  static void cleanup(String jobId) {
    platformInterface.cleanup(jobId);
  }

  static void cleanupJobs(List<String> jobIds) {
    platformInterface.cleanupJobs(jobIds);
  }

  static void submitJob(String jobId, bool deleteFilesOnSuccess) {
    platformInterface.submitJob(jobId, deleteFilesOnSuccess);
  }
}
