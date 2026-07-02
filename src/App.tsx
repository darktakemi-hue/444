/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MapSimulation } from './components/MapSimulation';
import { PassengerView } from './components/PassengerView';
import { DriverView } from './components/DriverView';
import { LOCATIONS, RIDE_CATEGORIES, SEED_COMPLETED_TRIPS } from './constants';
import { Location, RideCategory, Trip, DriverStats, CompletedTrip, CashoutHistory, PassengerStats, RedemptionHistory, ScheduledRide } from './types';
import { 
  Car, Shield, Smartphone, Layers, Trophy, Star, ArrowUpRight, 
  CheckCircle, Percent, Compass, UserCheck, RefreshCw, Sparkles, MapPin, DollarSign, Calendar,
  User, LogOut, Cloud, CloudCheck, CloudLightning
} from 'lucide-react';
import { fetchSimulationState, saveSimulationState } from './firebase';

export default function App() {
  // 0. Firebase & Session State
  const [simulationId] = useState<string>(() => {
    const saved = localStorage.getItem('df_simulation_id');
    if (saved) return saved;
    const newId = 'sim_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('df_simulation_id', newId);
    return newId;
  });
  const [firebaseLoaded, setFirebaseLoaded] = useState<boolean>(false);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');

  // 1. Core State
  const [activePersona, setActivePersona] = useState<'dual' | 'passenger' | 'driver'>(() => {
    const saved = localStorage.getItem('df_active_persona');
    if (saved === 'passenger' || saved === 'driver' || saved === 'dual') {
      return saved as 'passenger' | 'driver' | 'dual';
    }
    return 'dual';
  });
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('df_is_logged_in');
    return saved === 'true';
  });
  
  // 2. Persistent Driver Stats & History
  const [driverStats, setDriverStats] = useState<DriverStats>(() => {
    const saved = localStorage.getItem('df_driver_stats');
    if (saved) return JSON.parse(saved);
    return {
      todayEarnings: 1250.00,
      weeklyEarnings: 5800.00,
      totalTrips: 4,
      rating: 4.92,
      acceptanceRate: 0.96,
      walletBalance: 5800.00,
    };
  });

  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>(() => {
    const saved = localStorage.getItem('df_completed_trips');
    if (saved) return JSON.parse(saved);
    return SEED_COMPLETED_TRIPS;
  });

  const [cashoutHistory, setCashoutHistory] = useState<CashoutHistory[]>(() => {
    const saved = localStorage.getItem('df_cashout_history');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // 3. Persistent Passenger Stats, Redemptions & Scheduled Rides
  const [passengerStats, setPassengerStats] = useState<PassengerStats>(() => {
    const saved = localStorage.getItem('df_passenger_stats');
    if (saved) return JSON.parse(saved);
    return {
      rating: 4.88,
      ratingCount: 12,
      totalTrips: 12,
      loyaltyPoints: 120,
      totalSpent: 11500.00,
    };
  });

  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistory[]>(() => {
    const saved = localStorage.getItem('df_redemption_history');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [scheduledRides, setScheduledRides] = useState<ScheduledRide[]>(() => {
    const saved = localStorage.getItem('df_scheduled_rides');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [activeDiscount, setActiveDiscount] = useState<number>(() => {
    const saved = localStorage.getItem('df_active_discount');
    return saved ? parseFloat(saved) : 0;
  });

  // Pending ratings flow states
  const [pendingPassengerRating, setPendingPassengerRating] = useState<CompletedTrip | null>(() => {
    const saved = localStorage.getItem('df_pending_pass_rating');
    return saved ? JSON.parse(saved) : null;
  });

  const [pendingDriverRating, setPendingDriverRating] = useState<CompletedTrip | null>(() => {
    const saved = localStorage.getItem('df_pending_driver_rating');
    return saved ? JSON.parse(saved) : null;
  });

  // UI state
  const [showCompletedModal, setShowCompletedModal] = useState<CompletedTrip | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<'normal' | 'fast'>('normal');

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('df_active_persona', activePersona);
  }, [activePersona]);

  useEffect(() => {
    localStorage.setItem('df_is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('df_driver_stats', JSON.stringify(driverStats));
  }, [driverStats]);

  useEffect(() => {
    localStorage.setItem('df_completed_trips', JSON.stringify(completedTrips));
  }, [completedTrips]);

  useEffect(() => {
    localStorage.setItem('df_cashout_history', JSON.stringify(cashoutHistory));
  }, [cashoutHistory]);

  useEffect(() => {
    localStorage.setItem('df_passenger_stats', JSON.stringify(passengerStats));
  }, [passengerStats]);

  useEffect(() => {
    localStorage.setItem('df_redemption_history', JSON.stringify(redemptionHistory));
  }, [redemptionHistory]);

  useEffect(() => {
    localStorage.setItem('df_scheduled_rides', JSON.stringify(scheduledRides));
  }, [scheduledRides]);

  useEffect(() => {
    localStorage.setItem('df_active_discount', activeDiscount.toString());
  }, [activeDiscount]);

  useEffect(() => {
    if (pendingPassengerRating) {
      localStorage.setItem('df_pending_pass_rating', JSON.stringify(pendingPassengerRating));
    } else {
      localStorage.removeItem('df_pending_pass_rating');
    }
  }, [pendingPassengerRating]);

  useEffect(() => {
    if (pendingDriverRating) {
      localStorage.setItem('df_pending_driver_rating', JSON.stringify(pendingDriverRating));
    } else {
      localStorage.removeItem('df_pending_driver_rating');
    }
  }, [pendingDriverRating]);
 
  // 2.5. Firebase Initial Load & Real-time Sync
  useEffect(() => {
    async function loadFromFirebase() {
      try {
        const data = await fetchSimulationState(simulationId);
        if (data) {
          if (data.driverStats) setDriverStats(data.driverStats);
          if (data.completedTrips) setCompletedTrips(data.completedTrips);
          if (data.cashoutHistory) setCashoutHistory(data.cashoutHistory);
          if (data.passengerStats) setPassengerStats(data.passengerStats);
          if (data.redemptionHistory) setRedemptionHistory(data.redemptionHistory);
          if (data.scheduledRides) setScheduledRides(data.scheduledRides);
          if (data.activeDiscount !== undefined) setActiveDiscount(data.activeDiscount);
          if (data.activeTrip !== undefined) setActiveTrip(data.activeTrip);
          if (data.pendingPassengerRating !== undefined) setPendingPassengerRating(data.pendingPassengerRating);
          if (data.pendingDriverRating !== undefined) setPendingDriverRating(data.pendingDriverRating);
        } else {
          // Document does not exist yet, save current local storage/seed data to Firebase
          await saveSimulationState(simulationId, {
            driverStats,
            completedTrips,
            cashoutHistory,
            passengerStats,
            redemptionHistory,
            scheduledRides,
            activeDiscount,
            activeTrip,
            pendingPassengerRating,
            pendingDriverRating
          });
        }
      } catch (err) {
        console.error("Erro ao carregar dados do Firebase:", err);
      } finally {
        setFirebaseLoaded(true);
      }
    }
    loadFromFirebase();
  }, [simulationId]);

  useEffect(() => {
    if (!firebaseLoaded) return;

    setFirebaseSyncStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await saveSimulationState(simulationId, {
          driverStats,
          completedTrips,
          cashoutHistory,
          passengerStats,
          redemptionHistory,
          scheduledRides,
          activeDiscount,
          activeTrip,
          pendingPassengerRating,
          pendingDriverRating
        });
        setFirebaseSyncStatus('synced');
      } catch (err) {
        console.error("Erro ao sincronizar com o Firebase:", err);
        setFirebaseSyncStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    firebaseLoaded,
    simulationId,
    driverStats,
    completedTrips,
    cashoutHistory,
    passengerStats,
    redemptionHistory,
    scheduledRides,
    activeDiscount,
    activeTrip,
    pendingPassengerRating,
    pendingDriverRating
  ]);

  // 3. Automated Agent/Simulation Logic
  // Handles automated bot driver if passenger-only or automated bot passenger requests
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (activeTrip) {
      // Automate driver behavior if user is in "passenger" only mode
      if (activePersona === 'passenger') {
        if (activeTrip.status === 'SEARCHING') {
          // Bot driver accepts after 3 seconds
          timeout = setTimeout(() => {
            handleAcceptTrip();
          }, 3000);
        } else if (activeTrip.status === 'ACCEPTED') {
          // Transition to arriving immediately
          timeout = setTimeout(() => {
            setActiveTrip(prev => prev ? { ...prev, status: 'ARRIVING' } : null);
          }, 1500);
        }
      }
    }

    return () => clearTimeout(timeout);
  }, [activeTrip?.status, activePersona]);

  // 4. Ride Lifecycle Methods
  const handleRequestTrip = (pickup: Location, dropoff: Location, category: RideCategory) => {
    // Generate random passenger name
    const passengers = [
      { name: 'Lucas de Oliveira', rating: 4.85 },
      { name: 'Gabriela Mendes', rating: 4.95 },
      { name: 'Rodrigo Antunes', rating: 4.78 },
      { name: 'Juliana Costa', rating: 4.90 }
    ];
    
    const isUser = activePersona === 'passenger' || activePersona === 'dual';
    const passengerName = isUser ? 'Você' : passengers[Math.floor(Math.random() * passengers.length)].name;
    const passengerRating = isUser ? passengerStats.rating : passengers[Math.floor(Math.random() * passengers.length)].rating;

    // Calculate details
    const dx = dropoff.x - pickup.x;
    const dy = dropoff.y - pickup.y;
    const distanceKm = Math.max(1.5, parseFloat((Math.sqrt(dx * dx + dy * dy) * 0.3).toFixed(1)));
    const durationMin = Math.max(4, Math.round(distanceKm * 1.8));

    // Pricing
    const baseFare = category.baseFare + (distanceKm * category.perKm) + (durationMin * category.perMin);
    // Apply discount if user is requesting
    const discountAmount = isUser ? activeDiscount : 0;
    const grossFare = Math.max(2.0, baseFare - discountAmount);
    const platformFee = grossFare * (category.platformFeePercent / 100);
    const driverEarnings = grossFare - platformFee;

    const newTrip: Trip = {
      id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
      passengerName,
      passengerRating,
      pickup,
      dropoff,
      category,
      distanceKm,
      estimatedDurationMin: durationMin,
      fareTotal: parseFloat(grossFare.toFixed(2)),
      driverEarnings: parseFloat(driverEarnings.toFixed(2)),
      platformFeeAmount: parseFloat(platformFee.toFixed(2)),
      status: 'SEARCHING',
      createdAt: new Date().toISOString()
    };

    setActiveTrip(newTrip);
  };

  const handleCancelTrip = () => {
    setActiveTrip(null);
  };

  const handleAcceptTrip = () => {
    if (!activeTrip) return;
    setActiveTrip(prev => prev ? { ...prev, status: 'ACCEPTED' } : null);
    
    // Increment acceptance rate for driver slightly
    setDriverStats(prev => ({
      ...prev,
      acceptanceRate: Math.min(1, prev.acceptanceRate + 0.01)
    }));

    // Instantly advance to heading to passenger (arriving)
    setTimeout(() => {
      setActiveTrip(prev => prev && prev.status === 'ACCEPTED' ? { ...prev, status: 'ARRIVING' } : prev);
    }, 1500);
  };

  const handleRejectTrip = () => {
    setActiveTrip(null);
    setDriverStats(prev => ({
      ...prev,
      acceptanceRate: Math.max(0.7, prev.acceptanceRate - 0.05)
    }));
  };

  const handleConfirmArrival = () => {
    setActiveTrip(prev => prev ? { ...prev, status: 'ARRIVING' } : null);
  };

  const handleStartTrip = () => {
    setActiveTrip(prev => prev ? { ...prev, status: 'IN_TRIP' } : null);
  };

  const handleFinishTrip = (tipAmount: number) => {
    if (!activeTrip) return;

    const netEarning = activeTrip.driverEarnings + tipAmount;
    const dateObj = new Date();
    
    const newCompletedTrip: CompletedTrip = {
      id: activeTrip.id,
      passengerName: activeTrip.passengerName,
      pickupName: activeTrip.pickup.name,
      dropoffName: activeTrip.dropoff.name,
      categoryName: activeTrip.category.name,
      distanceKm: activeTrip.distanceKm,
      durationMin: activeTrip.estimatedDurationMin,
      fareTotal: activeTrip.fareTotal,
      driverEarnings: activeTrip.driverEarnings,
      platformFeeAmount: activeTrip.platformFeeAmount,
      competitorEarnings: parseFloat((activeTrip.fareTotal * 0.75).toFixed(2)), // 25% platform cut
      tip: tipAmount,
      date: 'Hoje',
      time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Save completed trip logs
    setCompletedTrips(prev => [newCompletedTrip, ...prev]);

    // 2. Update dynamic driver stats (excluding rating which will be updated by the passenger rating submission)
    setDriverStats(prev => ({
      ...prev,
      todayEarnings: parseFloat((prev.todayEarnings + netEarning).toFixed(2)),
      weeklyEarnings: parseFloat((prev.weeklyEarnings + netEarning).toFixed(2)),
      walletBalance: parseFloat((prev.walletBalance + netEarning).toFixed(2)),
      totalTrips: prev.totalTrips + 1,
    }));

    // 3. Update Passenger Loyalty Stats & total spent if user is passenger
    const isUser = activeTrip.passengerName === 'Você' || activeTrip.passengerName.includes('Agendado');
    if (isUser) {
      // Earn 1 point per 10 MT spent
      const pointsEarned = Math.round(activeTrip.fareTotal / 10);
      setPassengerStats(prev => ({
        ...prev,
        totalTrips: prev.totalTrips + 1,
        loyaltyPoints: prev.loyaltyPoints + pointsEarned,
        totalSpent: parseFloat((prev.totalSpent + activeTrip.fareTotal).toFixed(2))
      }));
    }

    // 4. Trigger Two-Way Ratings flow
    setPendingPassengerRating(newCompletedTrip);
    setPendingDriverRating(newCompletedTrip);

    // Reset active discount since it is now consumed
    setActiveDiscount(0);

    setActiveTrip(null);
    setShowCompletedModal(newCompletedTrip);
  };

  // Two-Way Rating submission handlers
  const handleRateDriver = (tripId: string, rating: number, tags: string[]) => {
    setDriverStats(prev => {
      const newRating = (((prev.rating * prev.totalTrips) + rating) / (prev.totalTrips + 1)).toFixed(2);
      return {
        ...prev,
        rating: parseFloat(newRating),
      };
    });
    setCompletedTrips(prev => prev.map(t => t.id === tripId ? { ...t, driverRating: rating, driverReviewTags: tags } : t));
    setPendingPassengerRating(null);
  };

  const handleRatePassenger = (tripId: string, rating: number, tags: string[]) => {
    setPassengerStats(prev => {
      const newRating = (((prev.rating * prev.ratingCount) + rating) / (prev.ratingCount + 1)).toFixed(2);
      return {
        ...prev,
        rating: parseFloat(newRating),
        ratingCount: prev.ratingCount + 1
      };
    });
    setCompletedTrips(prev => prev.map(t => t.id === tripId ? { ...t, passengerRating: rating, passengerReviewTags: tags } : t));
    setPendingDriverRating(null);
  };

  // Loyalty Program Rewards Redemption
  const handleRedeemReward = (reward: { id: string; title: string; pointsCost: number; type: 'discount' | 'benefit'; value?: number }) => {
    if (passengerStats.loyaltyPoints < reward.pointsCost) return null;

    const dateObj = new Date();
    const code = 'FAIR-' + reward.type.toUpperCase().substring(0, 4) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const newRedeem: RedemptionHistory = {
      id: 'RD-' + Math.floor(1000 + Math.random() * 9000),
      rewardTitle: reward.title,
      pointsSpent: reward.pointsCost,
      date: 'Hoje',
      time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      code
    };

    setRedemptionHistory(prev => [newRedeem, ...prev]);
    setPassengerStats(prev => ({
      ...prev,
      loyaltyPoints: prev.loyaltyPoints - reward.pointsCost
    }));

    if (reward.type === 'discount' && reward.value) {
      setActiveDiscount(prev => prev + (reward.value || 0));
    }

    return newRedeem;
  };

  // Scheduled Rides handlers
  const handleScheduleRide = (pickup: Location, dropoff: Location, category: RideCategory, date: string, time: string) => {
    const dx = dropoff.x - pickup.x;
    const dy = dropoff.y - pickup.y;
    const distanceKm = Math.max(1.5, parseFloat((Math.sqrt(dx * dx + dy * dy) * 0.3).toFixed(1)));
    const durationMin = Math.max(4, Math.round(distanceKm * 1.8));

    const totalFare = category.baseFare + (distanceKm * category.perKm) + (durationMin * category.perMin);

    const newScheduled: ScheduledRide = {
      id: 'SCH-' + Math.floor(1000 + Math.random() * 9000),
      pickup,
      dropoff,
      category,
      scheduledDate: date,
      scheduledTime: time,
      fareTotal: parseFloat(totalFare.toFixed(2)),
      status: 'PENDING'
    };

    setScheduledRides(prev => [newScheduled, ...prev]);
    return newScheduled;
  };

  const handleTriggerScheduledRide = (scheduledId: string) => {
    const ride = scheduledRides.find(r => r.id === scheduledId);
    if (!ride) return;

    // Mark scheduled ride as triggered
    setScheduledRides(prev => prev.map(r => r.id === scheduledId ? { ...r, status: 'TRIGGERED' } : r));

    // Request actual ride
    const finalFare = parseFloat(Math.max(2.0, ride.fareTotal - activeDiscount).toFixed(2));
    const platformFee = finalFare * (ride.category.platformFeePercent / 100);
    const driverEarnings = finalFare - platformFee;

    const newTrip: Trip = {
      id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
      passengerName: 'Você (Agendado)',
      passengerRating: passengerStats.rating,
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      category: ride.category,
      distanceKm: parseFloat(((ride.fareTotal / 10) + 1.2).toFixed(1)),
      estimatedDurationMin: Math.max(5, Math.round((ride.fareTotal / 10) * 2)),
      fareTotal: finalFare,
      driverEarnings: parseFloat(driverEarnings.toFixed(2)),
      platformFeeAmount: parseFloat(platformFee.toFixed(2)),
      status: 'SEARCHING',
      createdAt: new Date().toISOString()
    };

    setActiveTrip(newTrip);
  };

  const handleCancelScheduledRide = (scheduledId: string) => {
    setScheduledRides(prev => prev.map(r => r.id === scheduledId ? { ...r, status: 'CANCELLED' } : r));
  };

  // Automated step progression when car reaches points on map
  const handleReachPickup = () => {
    if (activeTrip?.status === 'ARRIVING') {
      // Driver arrived at passenger!
      // If customer-only mode, auto-board after 2.5s
      if (activePersona === 'passenger') {
        setTimeout(() => {
          handleStartTrip();
        }, 2500);
      }
    }
  };

  const handleReachDropoff = () => {
    if (activeTrip?.status === 'IN_TRIP') {
      // Car reached destination!
      // If customer-only mode, auto-finish with random tip
      if (activePersona === 'passenger') {
        setTimeout(() => {
          const tips = [0, 2, 5, 10];
          const randomTip = tips[Math.floor(Math.random() * tips.length)];
          handleFinishTrip(randomTip);
        }, 2500);
      }
    }
  };

  // Pix wallet cashout execution
  const handleCashout = (amount: number, pixKey: string) => {
    if (amount > driverStats.walletBalance) return false;

    const dateObj = new Date();
    const newCashout: CashoutHistory = {
      id: 'PX-' + Math.floor(100000 + Math.random() * 900000),
      amount,
      pixKey,
      status: 'COMPLETED',
      date: 'Hoje',
      time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setCashoutHistory(prev => [newCashout, ...prev]);
    setDriverStats(prev => ({
      ...prev,
      walletBalance: parseFloat((prev.walletBalance - amount).toFixed(2))
    }));

    return true;
  };

  // Reset Simulation database
  const handleResetApp = () => {
    localStorage.removeItem('df_driver_stats');
    localStorage.removeItem('df_completed_trips');
    localStorage.removeItem('df_cashout_history');
    localStorage.removeItem('df_passenger_stats');
    localStorage.removeItem('df_redemption_history');
    localStorage.removeItem('df_scheduled_rides');
    localStorage.removeItem('df_active_discount');
    localStorage.removeItem('df_pending_pass_rating');
    localStorage.removeItem('df_pending_driver_rating');
    
    setDriverStats({
      todayEarnings: 1250.00,
      weeklyEarnings: 5800.00,
      totalTrips: 4,
      rating: 4.92,
      acceptanceRate: 0.96,
      walletBalance: 5800.00,
    });
    setPassengerStats({
      rating: 4.88,
      ratingCount: 12,
      totalTrips: 12,
      loyaltyPoints: 120,
      totalSpent: 11500.00,
    });
    setCompletedTrips(SEED_COMPLETED_TRIPS);
    setCashoutHistory([]);
    setRedemptionHistory([]);
    setScheduledRides([]);
    setActiveDiscount(0);
    setPendingPassengerRating(null);
    setPendingDriverRating(null);
    setActiveTrip(null);
    setShowResetConfirm(false);
  };

  // Quick Random Request Generator (For testing driver view instantly!)
  const handleGenerateRandomRequest = () => {
    const pickupLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    let dropoffLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    while (dropoffLoc.id === pickupLoc.id) {
      dropoffLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    }
    const cat = RIDE_CATEGORIES[Math.floor(Math.random() * RIDE_CATEGORIES.length)];
    handleRequestTrip(pickupLoc, dropoffLoc, cat);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-elegant-bg text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
        {/* Simple Login Header */}
        <header className="bg-elegant-header/85 backdrop-blur-md border-b border-elegant-border px-4 py-5 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
                <Car className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black font-display text-white tracking-tight">DriveFair</h1>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-extrabold text-emerald-400 rounded-md uppercase tracking-wider">
                    Taxa Justa 10%
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">A alternativa justa para motoristas e passageiros</p>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 hidden sm:block text-right font-mono">
              <div>Avenida Julius Nyerere, Maputo</div>
              <div>Moçambique &bull; NUIT 400392019</div>
            </div>
          </div>
        </header>

        {/* Portal Body */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-16 flex flex-col justify-center items-center">
          <div className="text-center max-w-2xl space-y-3 mb-10 md:mb-14">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-none">
              Portal de Acesso DriveFair
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Escolha abaixo o perfil que deseja acessar para simular a nossa plataforma. Não é necessário preencher dados ou senhas.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            
            {/* Passageiro Card */}
            <div className="bg-elegant-card border border-elegant-border hover:border-indigo-500/30 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
              <div className="space-y-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Passageiro</span>
                    <h3 className="text-base font-extrabold text-white">Acesso do Cliente</h3>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Solicitar corridas em tempo real com mapas ao vivo</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Programa de Pontos FairGold para resgatar descontos</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Agendar viagens futuras com preços previsíveis</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => {
                    setActivePersona('passenger');
                    setIsLoggedIn(true);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/15 uppercase tracking-wider cursor-pointer"
                >
                  Entrar como Passageiro
                </button>
              </div>
            </div>

            {/* Motorista Card */}
            <div className="bg-elegant-card border border-elegant-border hover:border-emerald-500/30 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
              <div className="space-y-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Motorista</span>
                    <h3 className="text-base font-extrabold text-white">Painel do Motorista</h3>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Menor taxa de mercado: Retenção justa de apenas 10%</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Histórico de faturamento e carteira para saque móvel</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Saques imediatos via M-Pesa, e-Mola ou mKeshe</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => {
                    setActivePersona('driver');
                    setIsLoggedIn(true);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/15 uppercase tracking-wider cursor-pointer"
                >
                  Entrar como Motorista
                </button>
              </div>
            </div>

            {/* Modo Dual Card */}
            <div className="bg-elegant-card border border-elegant-border hover:border-violet-500/30 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/5 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
              <div className="space-y-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Demonstração</span>
                    <h3 className="text-base font-extrabold text-white">Modo Dual Simultâneo</h3>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Visualize passageiro e motorista lado a lado</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Ideal para demonstrações de fluxo completo ao vivo</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Acompanhe as solicitações cruzadas instantaneamente</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => {
                    setActivePersona('dual');
                    setIsLoggedIn(true);
                  }}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-violet-600/15 uppercase tracking-wider cursor-pointer"
                >
                  Entrar em Modo Dual
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* Simple Footer */}
        <footer className="bg-slate-950 border-t border-slate-900 text-center py-6 px-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <p>&copy; 2026 DriveFair Moçambique Limitada. NUIT 400392019. Avenida Julius Nyerere, Maputo.</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-300 cursor-pointer">Termos de Uso</span>
              <span className="hover:text-slate-300 cursor-pointer">Políticas de Privacidade</span>
              <span className="hover:text-slate-300 cursor-pointer">Central do Motorista</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-elegant-bg text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* 1. Header with Logo & Mode Toggles */}
      <header className="sticky top-0 z-40 bg-elegant-header/85 backdrop-blur-md border-b border-elegant-border px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Car className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black font-display text-white tracking-tight">DriveFair</h1>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-extrabold text-emerald-400 rounded-md uppercase tracking-wider">
                  Taxa Justa 10%
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5">
                <span>Melhor que Uber &bull; 90% de Repasse Líquido</span>
                <span className="text-slate-600">&bull;</span>
                <div className="flex items-center gap-1 font-mono text-[9px]">
                  {firebaseSyncStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      A GUARDAR...
                    </span>
                  )}
                  {firebaseSyncStatus === 'synced' && (
                    <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      <Cloud className="w-2.5 h-2.5" />
                      FIREBASE ONLINE
                    </span>
                  )}
                  {firebaseSyncStatus === 'error' && (
                    <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded">
                      <CloudLightning className="w-2.5 h-2.5" />
                      ERRO SYNC
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-3 self-center md:self-auto">
            <span className="text-xs text-slate-500 font-bold hidden lg:inline">Modo de Visualização:</span>
            <div className="bg-elegant-card p-1 rounded-xl border border-elegant-border flex text-xs font-bold">
              <button
                onClick={() => setActivePersona('dual')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activePersona === 'dual' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Dual (Simultâneo)
              </button>
              <button
                onClick={() => setActivePersona('passenger')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activePersona === 'passenger' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Passageiro
              </button>
              <button
                onClick={() => setActivePersona('driver')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activePersona === 'driver' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Motorista
              </button>
            </div>

            {/* Reset App Stats Data */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-elegant-card rounded-xl transition-all border border-transparent hover:border-elegant-border cursor-pointer"
              title="Reiniciar Simulação"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              onClick={() => setIsLoggedIn(false)}
              className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-elegant-card rounded-xl transition-all border border-transparent hover:border-elegant-border flex items-center gap-1.5 font-bold text-xs cursor-pointer"
              title="Terminar Sessão / Mudar de Perfil"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Overlay */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-elegant-card border border-elegant-border-high p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Deseja reiniciar a simulação?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Isso apagará o histórico de viagens simuladas, redefinirá seu saldo na carteira para o valor padrão de 5.800,00 MT e excluirá as transferências via M-Pesa / e-Mola.
            </p>
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-2 bg-elegant-bg border border-elegant-border hover:bg-elegant-header rounded-xl text-xs text-slate-300 font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetApp}
                className="py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs text-white font-extrabold transition-all"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Interactive Dashboard Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left/Middle Column - SVG MAP SIMULATION (Takes 5 cols in split, 7 in single, responsive) */}
        <div className={`space-y-4 lg:col-span-6 ${activePersona === 'passenger' || activePersona === 'driver' ? 'lg:col-span-7' : ''}`}>
          
          {/* Quick instructions indicator when in dual mode */}
          {activePersona === 'dual' && (
            <div className="bg-elegant-card/60 p-4.5 rounded-2xl border border-elegant-border flex items-start gap-3.5 animate-fade-in shadow-xl">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-extrabold text-white block mb-0.5">Demonstração Interativa Inteligente (Dual Mode)</span>
                Abaixo está o mapa ao vivo. Você pode <strong>pedir uma corrida à esquerda</strong> como Passageiro e ver o convite piscar instantaneamente para o <strong>Motorista à direita</strong>. Aceite e acompanhe o GPS navegar sozinho!
              </div>
            </div>
          )}

          {/* Quick Action bar for Driver mode to easily generate matching requests */}
          {activePersona === 'driver' && !activeTrip && (
            <div className="bg-elegant-card/50 p-4 rounded-2xl border border-elegant-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-white block">Status: Online &bull; Aguardando</span>
                <span className="text-slate-400">Quer testar o painel imediatamente como motorista?</span>
              </div>
              <button
                onClick={handleGenerateRandomRequest}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1"
              >
                <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                Gerar Corrida Aleatória
              </button>
            </div>
          )}

          {/* Master Map Display */}
          <MapSimulation
            activeTrip={activeTrip}
            onReachPickup={handleReachPickup}
            onReachDropoff={handleReachDropoff}
          />

          {/* Dynamic Map Navigation State banner */}
          {activeTrip && (
            <div className="bg-elegant-card/50 border border-elegant-border p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-slate-950 border text-slate-400 ${
                  activeTrip.status === 'ARRIVING' ? 'text-indigo-400 border-indigo-900/50' :
                  activeTrip.status === 'IN_TRIP' ? 'text-emerald-400 border-emerald-900/50' : 'border-slate-800'
                }`}>
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-white block uppercase text-[10px] tracking-wider text-slate-400">Rota GPS Ativa</span>
                  <span className="text-slate-300">
                    {activeTrip.status === 'SEARCHING' && 'Localizando veículo mais próximo...'}
                    {activeTrip.status === 'ACCEPTED' && 'Motorista aceitou a solicitação'}
                    {activeTrip.status === 'ARRIVING' && `Corolla a caminho de ${activeTrip.pickup.name}`}
                    {activeTrip.status === 'IN_TRIP' && `Destino: ${activeTrip.dropoff.name}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400">
                  {activeTrip.distanceKm} km
                </span>
                <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400">
                  {activeTrip.estimatedDurationMin} min
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Columns: Forms & Panels based on Active Mode view */}
        
        {/* VIEW 1: DUAL MODE Split screen side-by-side */}
        {activePersona === 'dual' && (
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Passenger View column */}
            <div>
              <PassengerView
                activeTrip={activeTrip}
                onRequestTrip={handleRequestTrip}
                onCancelTrip={handleCancelTrip}
                onFinishRating={() => {}}
                passengerStats={passengerStats}
                redemptionHistory={redemptionHistory}
                scheduledRides={scheduledRides}
                activeDiscount={activeDiscount}
                pendingPassengerRating={pendingPassengerRating}
                onRateDriver={handleRateDriver}
                onRedeemReward={handleRedeemReward}
                onScheduleRide={handleScheduleRide}
                onTriggerScheduledRide={handleTriggerScheduledRide}
                onCancelScheduledRide={handleCancelScheduledRide}
              />
            </div>

            {/* Driver View column */}
            <div>
              <DriverView
                activeTrip={activeTrip}
                driverStats={driverStats}
                completedTrips={completedTrips}
                cashoutHistory={cashoutHistory}
                onAcceptTrip={handleAcceptTrip}
                onRejectTrip={handleRejectTrip}
                onStartTrip={handleStartTrip}
                onFinishTrip={handleFinishTrip}
                onConfirmArrival={handleConfirmArrival}
                onCashout={handleCashout}
                pendingDriverRating={pendingDriverRating}
                onRatePassenger={handleRatePassenger}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: Passenger Only Focus */}
        {activePersona === 'passenger' && (
          <div className="lg:col-span-5">
            <PassengerView
              activeTrip={activeTrip}
              onRequestTrip={handleRequestTrip}
              onCancelTrip={handleCancelTrip}
              onFinishRating={() => {}}
              passengerStats={passengerStats}
              redemptionHistory={redemptionHistory}
              scheduledRides={scheduledRides}
              activeDiscount={activeDiscount}
              pendingPassengerRating={pendingPassengerRating}
              onRateDriver={handleRateDriver}
              onRedeemReward={handleRedeemReward}
              onScheduleRide={handleScheduleRide}
              onTriggerScheduledRide={handleTriggerScheduledRide}
              onCancelScheduledRide={handleCancelScheduledRide}
            />
          </div>
        )}

        {/* VIEW 3: Driver Only Focus */}
        {activePersona === 'driver' && (
          <div className="lg:col-span-5">
            <DriverView
              activeTrip={activeTrip}
              driverStats={driverStats}
              completedTrips={completedTrips}
              cashoutHistory={cashoutHistory}
              onAcceptTrip={handleAcceptTrip}
              onRejectTrip={handleRejectTrip}
              onStartTrip={handleStartTrip}
              onFinishTrip={handleFinishTrip}
              onConfirmArrival={handleConfirmArrival}
              onCashout={handleCashout}
              pendingDriverRating={pendingDriverRating}
              onRatePassenger={handleRatePassenger}
            />
          </div>
        )}

      </main>

      {/* 3. Global Completion Modal Celebration popup */}
      {showCompletedModal && (
        <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-elegant-card border border-elegant-border-high p-8 rounded-3xl max-w-md w-full space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-emerald-500"></div>
            
            {/* Celebration icon badge */}
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-white text-xl tracking-tight">Viagem Concluída com Sucesso!</h3>
              <p className="text-xs text-slate-400">Obrigado por apoiar a mobilidade urbana justa.</p>
            </div>

            {/* Receipt Summary details */}
            <div className="bg-elegant-bg p-5 rounded-2xl text-left border border-elegant-border space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Código da Viagem:</span>
                <span className="text-slate-300 font-mono font-bold">#{showCompletedModal.id}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Passageiro:</span>
                <span className="text-white font-bold">{showCompletedModal.passengerName}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-900">
                <span className="text-slate-400">Distância / Duração:</span>
                <span className="text-white">{showCompletedModal.distanceKm} km &bull; {showCompletedModal.durationMin} min</span>
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Pago pelo Passageiro:</span>
                  <span className="text-white font-bold">{showCompletedModal.fareTotal.toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Taxa Intermediação (10%):</span>
                  <span>- {showCompletedModal.platformFeeAmount.toFixed(2)} MT</span>
                </div>
                {showCompletedModal.tip > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                     <span>Gorjeta Adicional (100% repassada):</span>
                     <span>+ {showCompletedModal.tip.toFixed(2)} MT</span>
                  </div>
                )}
              </div>

              {/* Highlight extra driver keep */}
              <div className="pt-3 border-t border-slate-900 flex justify-between items-center font-bold text-sm">
                <span className="text-slate-300 uppercase tracking-wide text-[10px]">Repasse do Motorista:</span>
                <span className="text-base text-emerald-400">{(showCompletedModal.driverEarnings + showCompletedModal.tip).toFixed(2)} MT</span>
              </div>
            </div>

            {/* Callout of fairness comparison */}
            <div className="bg-emerald-600/10 p-3.5 rounded-xl text-[11px] text-emerald-400 border border-emerald-500/20 text-left space-y-1">
              <span className="font-extrabold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Impacto da Tarifa Justa:
              </span>
              <p className="text-slate-300 leading-relaxed">
                Neste app o motorista levou <strong>{(showCompletedModal.driverEarnings + showCompletedModal.tip).toFixed(2)} MT</strong>. Nos aplicativos convencionais (taxa de 25%+), ele receberia apenas <strong>{(showCompletedModal.competitorEarnings).toFixed(2)} MT</strong> pelo mesmo trajeto!
              </p>
            </div>

            <button
              onClick={() => setShowCompletedModal(null)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-sm rounded-2xl transition-all"
            >
              Excelente, Continuar!
            </button>
          </div>
        </div>
      )}

      {/* 4. Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 text-center py-6 px-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p>&copy; 2026 DriveFair Moçambique Limitada. NUIT 400392019. Avenida Julius Nyerere, Maputo.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Termos de Uso</span>
            <span className="hover:text-slate-300 cursor-pointer">Políticas de Privacidade</span>
            <span className="hover:text-slate-300 cursor-pointer">Central do Motorista</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
