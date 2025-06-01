CREATE
EXTENSION vector;

CREATE TABLE users (
   id SERIAL PRIMARY KEY,
   username VARCHAR(255) NOT NULL,
   email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE products
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rating DECIMAL(4,2) NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    users_id INT,
    CONSTRAINT fk_orders_users FOREIGN KEY (users_id) REFERENCES users (id)
);

CREATE TABLE orders_items (
   id SERIAL PRIMARY KEY,
   orders_id INT,
   products_id INT,
   qty INT,
   CONSTRAINT fk_orders_items_orders FOREIGN KEY (orders_id) REFERENCES orders (id),
   CONSTRAINT fk_orders_items_products FOREIGN KEY (products_id) REFERENCES products (id)
);

CREATE TABLE embeddings
(
    id SERIAL PRIMARY KEY,
    products_id INT,
    description TEXT,
    embedding VECTOR(768),
    CONSTRAINT fk_products_id
        FOREIGN KEY (products_id)
            REFERENCES products (id)
);