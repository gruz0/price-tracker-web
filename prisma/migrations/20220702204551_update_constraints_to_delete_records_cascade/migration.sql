-- DropForeignKey
ALTER TABLE "product_history" DROP CONSTRAINT "product_history_product_id_fkey";

-- DropForeignKey
ALTER TABLE "products_queue" DROP CONSTRAINT "products_queue_requested_by_id_fkey";

-- DropForeignKey
ALTER TABLE "user_product_subscriptions" DROP CONSTRAINT "user_product_subscriptions_product_id_fkey";

-- DropForeignKey
ALTER TABLE "user_product_subscriptions" DROP CONSTRAINT "user_product_subscriptions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_products" DROP CONSTRAINT "user_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "user_products" DROP CONSTRAINT "user_products_user_id_fkey";

-- AddForeignKey
ALTER TABLE "products_queue" ADD CONSTRAINT "products_queue_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_history" ADD CONSTRAINT "product_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_products" ADD CONSTRAINT "user_products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_products" ADD CONSTRAINT "user_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_product_subscriptions" ADD CONSTRAINT "user_product_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_product_subscriptions" ADD CONSTRAINT "user_product_subscriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
