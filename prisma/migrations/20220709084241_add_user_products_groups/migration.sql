-- CreateTable
CREATE TABLE "user_products_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "image" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_products_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_products_group_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "user_products_group_id" UUID NOT NULL,
    "user_product_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_products_group_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_products_group_items_user_id_user_products_group_id_us_key" ON "user_products_group_items"("user_id", "user_products_group_id", "user_product_id");

-- AddForeignKey
ALTER TABLE "user_products_groups" ADD CONSTRAINT "user_products_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_products_group_items" ADD CONSTRAINT "user_products_group_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_products_group_items" ADD CONSTRAINT "user_products_group_items_user_product_id_fkey" FOREIGN KEY ("user_product_id") REFERENCES "user_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_products_group_items" ADD CONSTRAINT "user_products_group_items_user_products_group_id_fkey" FOREIGN KEY ("user_products_group_id") REFERENCES "user_products_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
