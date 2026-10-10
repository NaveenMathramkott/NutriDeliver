import Order from '../models/Order.js';

// Auto-cancel unassigned orders after timeout
export const autoCancelUnassignedOrders = async (timeoutMinutes = 10) => {
  try {
    const cancelledOrders = await Order.autoCancelUnassignedOrders(timeoutMinutes);
    
    if (cancelledOrders.length > 0) {
      console.log(`Auto-cancelled ${cancelledOrders.length} unassigned orders`);
      
      // TODO: Send notifications to users and restaurants about auto-cancellation
      // This would integrate with the notification service
    }
    
    return cancelledOrders;
  } catch (error) {
    console.error('Auto-cancel job error:', error);
    return [];
  }
};

// Clean up old notifications (older than 30 days)
export const cleanupOldNotifications = async () => {
  try {
    const Notification = (await import('../models/notification.js')).default;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    });
    
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} old notifications`);
    }
    
    return result.deletedCount;
  } catch (error) {
    console.error('Cleanup notifications job error:', error);
    return 0;
  }
};

// Update restaurant open status based on operating hours
export const updateRestaurantOpenStatus = async () => {
  try {
    const Restaurant = (await import('../models/Restaurant.js')).default;
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const restaurants = await Restaurant.find({ isActive: true, isVerified: true });
    
    let updatedCount = 0;
    for (const restaurant of restaurants) {
      const isOpenDay = restaurant.operatingHours.days.includes(currentDay);
      const isWithinHours = isOpenDay && 
        currentTime >= restaurant.operatingHours.opening && 
        currentTime <= restaurant.operatingHours.closing;
      
      if (restaurant.isOpen !== isWithinHours) {
        restaurant.isOpen = isWithinHours;
        await restaurant.save();
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      console.log(`Updated open status for ${updatedCount} restaurants`);
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Update restaurant status job error:', error);
    return 0;
  }
};

// Run all scheduled jobs
export const runScheduledJobs = async () => {
  console.log('Running scheduled jobs...');
  await autoCancelUnassignedOrders(10); // Every 5 minutes
  await updateRestaurantOpenStatus(); // Every 5 minutes
  
  // Run daily at midnight
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    await cleanupOldNotifications();
  }
};