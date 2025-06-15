
-- Esempio: aggiorna immagini dei prodotti con URL reali
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80' WHERE name ILIKE '%Fertilizzante%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=400&q=80' WHERE name ILIKE '%Antiparassitario%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=400&q=80' WHERE name ILIKE '%Terriccio%';

-- Aggiorna articoli con immagini reali in base alla categoria o titolo
UPDATE library_articles SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d73c0c15b1?auto=format&fit=crop&w=400&q=80'
WHERE category ILIKE '%nutrienti%' OR title ILIKE '%vitality%';

UPDATE library_articles SET image_url = 'https://images.unsplash.com/photo-1585687433492-9c648106f131?auto=format&fit=crop&w=400&q=80'
WHERE category ILIKE '%fungicidi%' OR title ILIKE '%neem%';

UPDATE library_articles SET image_url = 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=400&q=80'
WHERE category ILIKE '%insetti%' OR title ILIKE '%afidi%';

UPDATE library_articles SET image_url = 'https://images.unsplash.com/photo-1603912699214-92627f304eb6?auto=format&fit=crop&w=400&q=80'
WHERE category ILIKE '%ph%' OR title ILIKE '%ph%';

-- Opzionale: aggiungi una default image per articoli senza immagine dopo i precedenti update
UPDATE library_articles SET image_url = 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80'
WHERE (image_url IS NULL OR image_url = '');
