CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  city TEXT NOT NULL,
  sector TEXT NOT NULL,
  description TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO projects (client_name, city, sector, image, description, featured) VALUES
('Titan', 'Patna', 'Corporate', '/images/clients/titan.webp', 'Complete office fit-out for Titan Patna branch', true),
('Usha', 'Patna', 'Manufacturing', '/images/clients/usha.webp', 'Executive and workstation seating', true),
('Bihar Government', 'Patna', 'Government', '/images/clients/bihar-govt.webp', 'Secretariat office furnishing', true),
('DMRC', 'Delhi', 'Government', '/images/clients/dmrc.webp', 'Administrative office workstations', true),
('TVS', 'Patna', 'Automotive', '/images/clients/tvs.webp', 'Showroom and office seating', false);
