ALTER TABLE `orders` ADD `paymentStatus` enum('pending','processing','completed','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` varchar(50) DEFAULT 'mpesa';--> statement-breakpoint
ALTER TABLE `orders` ADD `mpesaTransactionId` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `mpesaCheckoutRequestId` varchar(100);