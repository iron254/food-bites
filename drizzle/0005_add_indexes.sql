-- Foreign key indexes for joins
CREATE INDEX idx_orders_userId ON orders(userId);
CREATE INDEX idx_orders_restaurantId ON orders(restaurantId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_createdAt ON orders(createdAt);
CREATE INDEX idx_orderItems_orderId ON order_items(orderId);
CREATE INDEX idx_orderItems_menuItemId ON order_items(menuItemId);
CREATE INDEX idx_menuItems_restaurantId ON menu_items(restaurantId);
CREATE INDEX idx_menuCategories_restaurantId ON menu_categories(restaurantId);
CREATE INDEX idx_bookmarks_userId ON bookmarks(userId);
CREATE INDEX idx_bookmarks_restaurantId ON bookmarks(restaurantId);
CREATE INDEX idx_smsLogs_orderId ON sms_logs(orderId);
CREATE INDEX idx_restaurants_featured ON restaurants(featured);
CREATE INDEX idx_restaurants_isOpen ON restaurants(isOpen);
CREATE INDEX idx_menuItems_isPopular ON menu_items(isPopular);
CREATE INDEX idx_users_openId ON users(openId);

-- Composite indexes for common queries
CREATE INDEX idx_orders_userId_createdAt ON orders(userId, createdAt DESC);
CREATE INDEX idx_orders_restaurantId_status ON orders(restaurantId, status);
CREATE INDEX idx_bookmarks_userId_restaurantId ON bookmarks(userId, restaurantId);
