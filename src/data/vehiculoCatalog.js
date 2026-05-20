
export const vehiculoCatalog = {
  'Fiat': [
    'Uno', 'Palio', 'Siena', 'Punto', 'Cronos', 'Argo', 'Mobi', 'Strada', 'Toro',
    'Pulse', 'Fastback', '500', 'Duna', 'Fiorino', 'Ducato', 'Tipo', '147',
  ],
  'Volkswagen': [
    'Gol', 'Gol Trend', 'Voyage', 'Polo', 'Virtus', 'Vento', 'Amarok', 'Tiguan',
    'T-Cross', 'Taos', 'Saveiro', 'Suran', 'Fox', 'Bora', 'Golf', 'Nivus', 'Up!',
  ],
  'Chevrolet': [
    'Corsa', 'Classic', 'Onix', 'Prisma', 'Cruze', 'Tracker', 'Spin', 'S10',
    'Montana', 'Joy', 'Equinox', 'Aveo', 'Celta', 'Agile', 'Sonic', 'Camaro',
  ],
  'Ford': [
    'Ka', 'Fiesta', 'Focus', 'EcoSport', 'Ranger', 'Territory', 'Bronco',
    'Maverick', 'F-100', 'F-150', 'Mondeo', 'Falcon', 'Transit', 'Kuga',
  ],
  'Renault': [
    'Kwid', 'Sandero', 'Logan', 'Stepway', 'Duster', 'Kangoo', 'Captur',
    'Fluence', 'Megane', 'Clio', 'Koleos', 'Symbol', 'Master', 'Alaskan',
  ],
  'Peugeot': [
    '208', '308', '408', '2008', '3008', '5008', 'Partner', 'Expert', 'Boxer',
    '206', '207', '301',
  ],
  'Toyota': [
    'Etios', 'Yaris', 'Corolla', 'Corolla Cross', 'Hilux', 'SW4', 'RAV4',
    'Camry', 'Land Cruiser', 'Innova', 'GR86',
  ],
  'Citroën': [
    'C3', 'C4 Cactus', 'C4 Lounge', 'Berlingo', 'C-Elysée', 'C5 Aircross',
    'Jumper', 'Jumpy',
  ],
  'Honda': [
    'Civic', 'City', 'HR-V', 'CR-V', 'WR-V', 'Fit', 'Accord',
  ],
  'Nissan': [
    'March', 'Versa', 'Sentra', 'Kicks', 'Frontier', 'X-Trail', 'Note',
  ],
  'Hyundai': [
    'HB20', 'Creta', 'Tucson', 'Santa Fe', 'i10', 'i30', 'Kona', 'Ioniq',
  ],
  'Kia': [
    'Picanto', 'Rio', 'Cerato', 'Seltos', 'Sportage', 'Sorento', 'Carnival',
  ],
  'Mercedes-Benz': [
    'Sprinter', 'Vito', 'Clase A', 'Clase C', 'Clase E', 'GLA', 'GLC', 'GLE',
  ],
  'BMW': [
    'Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'X1', 'X3', 'X5',
  ],
  'Jeep': [
    'Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator',
  ],
  'Suzuki': [
    'Swift', 'Baleno', 'Vitara', 'Jimny', 'S-Cross', 'Ignis',
  ],
  'Mitsubishi': [
    'L200', 'ASX', 'Outlander', 'Eclipse Cross', 'Montero',
  ],
  'RAM': [
    '1500', '2500', '700',
  ],
  'Chery': [
    'QQ', 'Tiggo 2', 'Tiggo 3', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo',
  ],
  'Iveco': [
    'Daily', 'Tector', 'Vertis', 'Eurocargo',
  ],
};

export const marcas = Object.keys(vehiculoCatalog).sort();

export function getModelos(marca) {
  return vehiculoCatalog[marca] || [];
}
