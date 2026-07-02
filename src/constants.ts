import { Location, RideCategory, CompletedTrip } from './types';

export const LOCATIONS: Location[] = [
  { id: '1', name: 'Avenida Julius Nyerere, Polana', x: 50, y: 50 },
  { id: '2', name: 'Aeroporto Internacional de Mavalane (MPM)', x: 45, y: 80 },
  { id: '3', name: 'Jardim Tunduru, Baixa', x: 55, y: 65 },
  { id: '4', name: 'FEIMA - Parque dos Continuadores', x: 25, y: 35 },
  { id: '5', name: 'Mercado Central de Maputo', x: 20, y: 55 },
  { id: '6', name: 'Matola Cidade (Centro)', x: 65, y: 25 },
  { id: '7', name: 'Marginal - Praia da Costa do Sol', x: 30, y: 60 },
  { id: '8', name: 'Praça da OUA', x: 38, y: 65 },
  { id: '9', name: 'Museu de História Natural', x: 90, y: 15 },
];

export const RIDE_CATEGORIES: RideCategory[] = [
  {
    id: 'eco',
    name: 'DriveEco',
    icon: 'Leaf',
    baseFare: 150.00,
    perKm: 40.00,
    perMin: 8.00,
    platformFeePercent: 10, // 10% fee
    description: 'Carros compactos e económicos para o dia a dia em Maputo.'
  },
  {
    id: 'comfort',
    name: 'DriveComfort',
    icon: 'Sparkles',
    baseFare: 220.00,
    perKm: 55.00,
    perMin: 12.00,
    platformFeePercent: 10, // 10% fee
    description: 'Veículos modernos, espaçosos e com ar condicionado potente.'
  },
  {
    id: 'premium',
    name: 'DrivePremium',
    icon: 'Crown',
    baseFare: 350.00,
    perKm: 80.00,
    perMin: 18.00,
    platformFeePercent: 10, // 10% fee
    description: 'Sedãs topo de gama e SUVs com motoristas de elite.'
  }
];

// Seed some high-fidelity completed trips for driver history to display transparent gains in Meticais
export const SEED_COMPLETED_TRIPS: CompletedTrip[] = [
  {
    id: 'TX-4891',
    passengerName: 'Mariana Silva',
    pickupName: 'Aeroporto Internacional de Mavalane (MPM)',
    dropoffName: 'Avenida Julius Nyerere, Polana',
    categoryName: 'DriveComfort',
    distanceKm: 8.4,
    durationMin: 18,
    fareTotal: 650.00,
    platformFeeAmount: 65.00, // 10%
    driverEarnings: 585.00,
    competitorEarnings: 487.50, // 25% fee (earnings would be 75% of 650.00 = 487.50)
    tip: 50.00,
    date: 'Hoje',
    time: '09:45'
  },
  {
    id: 'TX-4890',
    passengerName: 'Carlos Eduardo',
    pickupName: 'FEIMA - Parque dos Continuadores',
    dropoffName: 'Jardim Tunduru, Baixa',
    categoryName: 'DriveEco',
    distanceKm: 3.2,
    durationMin: 9,
    fareTotal: 320.00,
    platformFeeAmount: 32.00, // 10%
    driverEarnings: 288.00,
    competitorEarnings: 240.00, // 25% fee (earnings would be 240.00)
    tip: 0.00,
    date: 'Hoje',
    time: '08:12'
  },
  {
    id: 'TX-4889',
    passengerName: 'Ana Beatriz',
    pickupName: 'Mercado Central de Maputo',
    dropoffName: 'Marginal - Praia da Costa do Sol',
    categoryName: 'DriveComfort',
    distanceKm: 6.1,
    durationMin: 14,
    fareTotal: 480.00,
    platformFeeAmount: 48.00, // 10%
    driverEarnings: 432.00,
    competitorEarnings: 360.00, // 25% fee
    tip: 30.00,
    date: 'Ontem',
    time: '21:30'
  },
  {
    id: 'TX-4888',
    passengerName: 'Gustavo Santos',
    pickupName: 'Matola Cidade (Centro)',
    dropoffName: 'Aeroporto Internacional de Mavalane (MPM)',
    categoryName: 'DrivePremium',
    distanceKm: 28.5,
    durationMin: 42,
    fareTotal: 1250.00,
    platformFeeAmount: 125.00, // 10%
    driverEarnings: 1125.00,
    competitorEarnings: 937.50, // 25% fee
    tip: 100.00,
    date: 'Ontem',
    time: '17:15'
  }
];
