CREATE TABLE `menu_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `menu_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`categoryId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(8,2) NOT NULL,
	`imageUrl` text,
	`isAvailable` boolean DEFAULT true,
	`isPopular` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`menuItemId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(8,2) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`status` enum('placed','preparing','on_the_way','delivered','cancelled') NOT NULL DEFAULT 'placed',
	`totalAmount` decimal(10,2) NOT NULL,
	`deliveryFee` decimal(6,2) DEFAULT '2.99',
	`deliveryAddress` text NOT NULL,
	`deliveryName` varchar(255),
	`deliveryPhone` varchar(50),
	`notes` text,
	`estimatedDelivery` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`cuisine` varchar(100) NOT NULL,
	`imageUrl` text,
	`rating` decimal(3,2) DEFAULT '0.00',
	`reviewCount` int DEFAULT 0,
	`deliveryTime` varchar(50) DEFAULT '30-45 min',
	`deliveryFee` decimal(6,2) DEFAULT '2.99',
	`minOrder` decimal(6,2) DEFAULT '10.00',
	`isOpen` boolean DEFAULT true,
	`featured` boolean DEFAULT false,
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurants_id` PRIMARY KEY(`id`)
);
