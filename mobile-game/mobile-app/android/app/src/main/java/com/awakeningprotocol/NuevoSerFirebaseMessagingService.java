package com.awakeningprotocol;

import android.util.Log;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * NuevoSerFirebaseMessagingService
 * Handles Firebase Cloud Messaging notifications for Awakening Protocol
 * Extends FirebaseMessagingService to handle remote notifications and token refreshes
 */
public class NuevoSerFirebaseMessagingService extends FirebaseMessagingService {
  private static final String TAG = "FCM_Service";

  /**
   * Called when a message is received from Firebase Cloud Messaging
   * @param remoteMessage The message received from FCM
   */
  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    super.onMessageReceived(remoteMessage);

    Log.d(TAG, "Message received from: " + remoteMessage.getFrom());

    // Handle notification message
    if (remoteMessage.getNotification() != null) {
      String title = remoteMessage.getNotification().getTitle();
      String body = remoteMessage.getNotification().getBody();
      Log.d(TAG, "Notification title: " + title);
      Log.d(TAG, "Notification body: " + body);

      // In a real app, you would display the notification here
      // For now, just logging
    }

    // Handle data message
    if (remoteMessage.getData().size() > 0) {
      Log.d(TAG, "Message data payload: " + remoteMessage.getData());
      // Handle custom data payload here
    }
  }

  /**
   * Called when a new FCM token is generated
   * This token should be sent to your backend for push notifications
   * @param token The new FCM registration token
   */
  @Override
  public void onNewToken(String token) {
    super.onNewToken(token);
    Log.d(TAG, "Refreshed token: " + token);

    // Send this token to your backend server to store for push notifications
    // For now, just logging
    sendRegistrationTokenToBackend(token);
  }

  /**
   * Send the registration token to backend
   * In a production app, this would HTTP POST to your server
   */
  private void sendRegistrationTokenToBackend(String token) {
    Log.d(TAG, "Sending token to backend: " + token);
    // TODO: Implement backend token registration
    // This would typically be an HTTP request to your backend API
  }
}
