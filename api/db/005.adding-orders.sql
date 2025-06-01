INSERT INTO orders (users_id) VALUES ((SELECT id FROM users WHERE username = 'RandomDog'));

INSERT INTO orders_items (orders_id, products_id, qty) VALUES ( (SELECT id FROM orders WHERE users_id = (SELECT id FROM users WHERE username = 'RandomDog') LIMIT 1), (SELECT id FROM products WHERE name = 'Inception'), 1);