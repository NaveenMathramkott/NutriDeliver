import admin from 'firebase-admin';

// Initialize Firebase Admin (you'll need to set up Firebase credentials)
const initializeFirebase = () => {
  if (!admin.apps.length) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
};

// Notification templates
const notificationTemplates = {
  orderConfirmed: (orderId, restaurantName) => ({
    title: 'Order Confirmed! 🎉',
    body: `Your order from ${restaurantName} is being prepared.`,
    data: { orderId, type: 'order_update' }
  }),

  orderReady: (orderId, restaurantName) => ({
    title: 'Order Ready! ✅',
    body: `Your order from ${restaurantName} is ready for pickup.`,
    data: { orderId, type: 'order_update' }
  }),

  riderAssigned: (orderId, riderName) => ({
    title: 'Rider Assigned! 🚴',
    body: `${riderName} is on the way to pick up your order.`,
    data: { orderId, type: 'order_update' }
  }),

  orderPickedUp: (orderId) => ({
    title: 'Order Picked Up! 📦',
    body: 'Your order has been picked up and is on the way to you.',
    data: { orderId, type: 'order_update' }
  }),

  orderDelivered: (orderId) => ({
    title: 'Order Delivered! 🎊',
    body: 'Your order has been delivered. Enjoy your meal!',
    data: { orderId, type: 'order_update' }
  }),

  newOffer: (offerCode, discount) => ({
    title: 'Special Offer! 🎁',
    body: `Get ${discount} off your next order with code ${offerCode}`,
    data: { type: 'promotion' }
  }),

  riderNewOrder: (orderId, restaurantName, distance) => ({
    title: 'New Delivery Available! 📍',
    body: `Order from ${restaurantName} - ${distance}km away`,
    data: { orderId, type: 'rider_order' }
  })
};

// Send push notification to a single device
export const sendPushNotification = async (deviceToken, notification, data = {}) => {
  try {
    initializeFirebase();

    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...notification.data,
        ...data,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // Handle specific FCM errors
    if (error.code === 'messaging/registration-token-not-registered') {
      // Token is no longer valid, should be removed from database
      return { success: false, error: 'Token not registered', shouldRemoveToken: true };
    }
    
    return { success: false, error: error.message };
  }
};

// Send push notification to multiple devices
export const sendPushNotificationToMultiple = async (deviceTokens, notification, data = {}) => {
  try {
    initializeFirebase();

    const message = {
      tokens: deviceTokens,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...notification.data,
        ...data,
        timestamp: new Date().toISOString()
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Check for failed tokens
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(deviceTokens[idx]);
        console.error(`Failed to send to token ${deviceTokens[idx]}:`, resp.error);
      }
    });

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens
    };
  } catch (error) {
    console.error('Error sending multicast push notification:', error);
    return { success: false, error: error.message };
  }
};

// Send notification using template
export const sendTemplateNotification = async (deviceToken, templateName, templateData) => {
  if (!notificationTemplates[templateName]) {
    throw new Error(`Notification template '${templateName}' not found`);
  }

  const notification = notificationTemplates[templateName](...templateData);
  return await sendPushNotification(deviceToken, notification);
};

// Subscribe to topic
export const subscribeToTopic = async (deviceTokens, topic) => {
  try {
    initializeFirebase();
    
    const response = await admin.messaging().subscribeToTopic(deviceTokens, topic);
    return { success: true, ...response };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return { success: false, error: error.message };
  }
};

// Unsubscribe from topic
export const unsubscribeFromTopic = async (deviceTokens, topic) => {
  try {
    initializeFirebase();
    
    const response = await admin.messaging().unsubscribeFromTopic(deviceTokens, topic);
    return { success: true, ...response };
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to topic
export const sendNotificationToTopic = async (topic, notification, data = {}) => {
  try {
    initializeFirebase();

    const message = {
      topic: topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...notification.data,
        ...data,
        timestamp: new Date().toISOString()
      }
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending topic notification:', error);
    return { success: false, error: error.message };
  }
};