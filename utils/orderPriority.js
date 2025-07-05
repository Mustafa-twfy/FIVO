// نظام ترتيب الطلبات الذكي
export class OrderPrioritySystem {
  
  // حساب أولوية الطلب بناءً على عدة عوامل
  static calculatePriority(order, driverLocation = null) {
    let priority = 0;
    
    // 1. أولوية الوقت (الطلبات الأحدث لها أولوية أعلى)
    const orderAge = Date.now() - new Date(order.created_at).getTime();
    const timePriority = Math.max(0, 100 - (orderAge / (1000 * 60 * 5))); // تنقص 1 كل 5 دقائق
    priority += timePriority * 0.3; // 30% من الأولوية
    
    // 2. أولوية المبلغ (الطلبات الأعلى سعراً لها أولوية أعلى)
    const amountPriority = Math.min(100, (order.total_amount || 0) / 10); // 10 دينار = 100 نقطة
    priority += amountPriority * 0.25; // 25% من الأولوية
    
    // 3. أولوية المسافة (إذا كان لدينا موقع السائق)
    if (driverLocation && order.store_location) {
      const distance = this.calculateDistance(
        driverLocation.latitude, 
        driverLocation.longitude,
        order.store_location.latitude,
        order.store_location.longitude
      );
      const distancePriority = Math.max(0, 100 - (distance * 10)); // تنقص 10 لكل كم
      priority += distancePriority * 0.2; // 20% من الأولوية
    }
    
    // 4. أولوية نوع المتجر
    const storeTypePriority = this.getStoreTypePriority(order.store_category);
    priority += storeTypePriority * 0.15; // 15% من الأولوية
    
    // 5. أولوية الطوارئ (إذا كان الطلب عاجل)
    if (order.is_urgent) {
      priority += 50; // إضافة 50 نقطة للطلبات العاجلة
    }
    
    return Math.round(priority);
  }
  
  // حساب المسافة بين نقطتين
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومترات
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // المسافة بالكيلومترات
    return distance;
  }
  
  static deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  
  // أولوية نوع المتجر
  static getStoreTypePriority(category) {
    const priorities = {
      'صيدليات': 100,      // أعلى أولوية
      'مطاعم': 80,
      'مخابز': 70,
      'محلات': 60,
      'خدمات': 50,
      'أخرى': 30
    };
    return priorities[category] || 30;
  }
  
  // ترتيب الطلبات حسب الأولوية
  static sortOrdersByPriority(orders, driverLocation = null) {
    return orders
      .map(order => ({
        ...order,
        priority: this.calculatePriority(order, driverLocation)
      }))
      .sort((a, b) => b.priority - a.priority);
  }
  
  // تصنيف الطلبات
  static categorizeOrders(orders) {
    const categories = {
      urgent: [],      // طلبات عاجلة
      highValue: [],   // طلبات عالية القيمة
      nearby: [],      // طلبات قريبة
      regular: []      // طلبات عادية
    };
    
    orders.forEach(order => {
      if (order.is_urgent) {
        categories.urgent.push(order);
      } else if (order.total_amount >= 50) {
        categories.highValue.push(order);
      } else if (order.distance && order.distance <= 2) {
        categories.nearby.push(order);
      } else {
        categories.regular.push(order);
      }
    });
    
    return categories;
  }
  
  // إنشاء ملخص الطلبات
  static generateOrderSummary(orders) {
    const totalOrders = orders.length;
    const totalValue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const urgentOrders = orders.filter(order => order.is_urgent).length;
    const highValueOrders = orders.filter(order => (order.total_amount || 0) >= 50).length;
    
    return {
      totalOrders,
      totalValue,
      urgentOrders,
      highValueOrders,
      averageValue: totalOrders > 0 ? totalValue / totalOrders : 0
    };
  }
  
  // اقتراح أفضل الطلبات للسائق
  static suggestBestOrders(orders, driverInfo) {
    const sortedOrders = this.sortOrdersByPriority(orders);
    
    // فلترة الطلبات حسب قدرات السائق
    const suitableOrders = sortedOrders.filter(order => {
      // التحقق من نوع المركبة
      if (order.requires_special_vehicle && driverInfo.vehicle_type !== order.required_vehicle_type) {
        return false;
      }
      
      // التحقق من منطقة العمل
      if (order.zone_restriction && !driverInfo.working_zones?.includes(order.zone_restriction)) {
        return false;
      }
      
      return true;
    });
    
    return suitableOrders.slice(0, 10); // أفضل 10 طلبات
  }
}

// دوال مساعدة للطلبات
export const OrderHelpers = {
  
  // تنسيق وقت الطلب
  formatOrderTime(createdAt) {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffMinutes < 1440) return `منذ ${Math.floor(diffMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffMinutes / 1440)} يوم`;
  },
  
  // تنسيق المبلغ
  formatAmount(amount) {
    return `${amount?.toFixed(0) || 0} دينار`;
  },
  
  // تنسيق المسافة
  formatDistance(distance) {
    if (!distance) return 'غير محدد';
    if (distance < 1) return `${(distance * 1000).toFixed(0)} متر`;
    return `${distance.toFixed(1)} كم`;
  },
  
  // الحصول على لون الحالة
  getStatusColor(status) {
    const colors = {
      'pending': '#FF9800',    // برتقالي
      'accepted': '#4CAF50',   // أخضر
      'picked_up': '#2196F3',  // أزرق
      'delivered': '#9C27B0',  // بنفسجي
      'cancelled': '#F44336'   // أحمر
    };
    return colors[status] || '#666';
  },
  
  // الحصول على نص الحالة
  getStatusText(status) {
    const texts = {
      'pending': 'في الانتظار',
      'accepted': 'مقبول',
      'picked_up': 'تم الاستلام',
      'delivered': 'تم التوصيل',
      'cancelled': 'ملغي'
    };
    return texts[status] || 'غير محدد';
  },
  
  // التحقق من صلاحية الطلب
  isOrderValid(order) {
    const maxAge = 24 * 60 * 60 * 1000; // 24 ساعة
    const orderAge = Date.now() - new Date(order.created_at).getTime();
    return orderAge < maxAge && order.status === 'pending';
  }
}; 