export interface Location {
  id: string;
  name: string;
  x: number; // 0 to 100 for SVG map positioning
  y: number; // 0 to 100 for SVG map positioning
}

export interface RideCategory {
  id: 'eco' | 'comfort' | 'premium';
  name: string;
  icon: string;
  baseFare: number;
  perKm: number;
  perMin: number;
  platformFeePercent: number; // 10% standard vs 25% competitors
  description: string;
}

export type TripStatus = 'IDLE' | 'SEARCHING' | 'ACCEPTED' | 'ARRIVING' | 'IN_TRIP' | 'COMPLETED';

export interface Trip {
  id: string;
  passengerName: string;
  passengerRating: number;
  pickup: Location;
  dropoff: Location;
  category: RideCategory;
  distanceKm: number;
  estimatedDurationMin: number;
  fareTotal: number;
  driverEarnings: number;
  platformFeeAmount: number;
  status: TripStatus;
  currentX?: number;
  currentY?: number;
  tip?: number;
  createdAt: string;
}

export interface DriverStats {
  todayEarnings: number;
  weeklyEarnings: number;
  totalTrips: number;
  rating: number;
  acceptanceRate: number;
  walletBalance: number;
}

export interface CompletedTrip {
  id: string;
  passengerName: string;
  pickupName: string;
  dropoffName: string;
  categoryName: string;
  distanceKm: number;
  durationMin: number;
  fareTotal: number;
  driverEarnings: number;
  platformFeeAmount: number;
  competitorEarnings: number; // Driver earnings if they used competitor (25% fee)
  tip: number;
  date: string;
  time: string;
  driverRating?: number; // given by passenger
  passengerRating?: number; // given by driver
  driverReviewTags?: string[];
  passengerReviewTags?: string[];
}

export interface PassengerStats {
  rating: number;
  ratingCount: number;
  totalTrips: number;
  loyaltyPoints: number;
  totalSpent: number;
}

export interface RedemptionHistory {
  id: string;
  rewardTitle: string;
  pointsSpent: number;
  date: string;
  time: string;
  code: string;
}

export interface ScheduledRide {
  id: string;
  pickup: Location;
  dropoff: Location;
  category: RideCategory;
  scheduledTime: string; // "HH:MM"
  scheduledDate: string; // "YYYY-MM-DD"
  fareTotal: number;
  status: 'PENDING' | 'TRIGGERED' | 'CANCELLED';
}

export interface CashoutHistory {
  id: string;
  amount: number;
  pixKey: string;
  status: 'PENDING' | 'COMPLETED';
  date: string;
  time: string;
}
