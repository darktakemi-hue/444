import React, { useState } from 'react';
import { Location, RideCategory, Trip, TripStatus, PassengerStats, RedemptionHistory, ScheduledRide, CompletedTrip } from '../types';
import { LOCATIONS, RIDE_CATEGORIES } from '../constants';
import { 
  MapPin, ArrowRightLeft, Star, Clock, Sparkles, User, ShieldCheck, 
  HelpCircle, Gift, Calendar, Check, Send, Award, History, X, Copy, Trash2, Compass
} from 'lucide-react';

const LOYALTY_REWARDS = [
  { id: 'R1', title: 'Desconto de 150 MT', pointsCost: 100, type: 'discount' as const, value: 150, description: 'Aplicado no próximo pedido.' },
  { id: 'R2', title: 'Desconto de 400 MT', pointsCost: 200, type: 'discount' as const, value: 400, description: 'Aplicado no próximo pedido.' },
  { id: 'R3', title: 'Desconto de 1000 MT', pointsCost: 500, type: 'discount' as const, value: 1000, description: 'Economia gigante e justa.' },
  { id: 'R4', title: 'Seguro Viagem FairGold', pointsCost: 50, type: 'benefit' as const, description: 'Proteção extra durante as corridas.' },
  { id: 'R5', title: 'Busca Prioritária', pointsCost: 80, type: 'benefit' as const, description: 'Prioridade máxima na fila de espera.' },
  { id: 'R6', title: 'Upgrade de Categoria', pointsCost: 150, type: 'benefit' as const, description: 'Viagem em veículo superior sem taxas.' },
];

interface PassengerViewProps {
  activeTrip: Trip | null;
  onRequestTrip: (pickup: Location, dropoff: Location, category: RideCategory) => void;
  onCancelTrip: () => void;
  onFinishRating: () => void;
  passengerStats: PassengerStats;
  redemptionHistory: RedemptionHistory[];
  scheduledRides: ScheduledRide[];
  activeDiscount: number;
  pendingPassengerRating: CompletedTrip | null;
  onRateDriver: (tripId: string, rating: number, tags: string[]) => void;
  onRedeemReward: (reward: any) => RedemptionHistory | null;
  onScheduleRide: (pickup: Location, dropoff: Location, category: RideCategory, date: string, time: string) => ScheduledRide;
  onTriggerScheduledRide: (scheduledId: string) => void;
  onCancelScheduledRide: (scheduledId: string) => void;
}

export const PassengerView: React.FC<PassengerViewProps> = ({
  activeTrip,
  onRequestTrip,
  onCancelTrip,
  onFinishRating,
  passengerStats,
  redemptionHistory,
  scheduledRides,
  activeDiscount,
  pendingPassengerRating,
  onRateDriver,
  onRedeemReward,
  onScheduleRide,
  onTriggerScheduledRide,
  onCancelScheduledRide,
}) => {
  const [pickup, setPickup] = useState<Location>(LOCATIONS[0]);
  const [dropoff, setDropoff] = useState<Location>(LOCATIONS[2]);
  const [selectedCatId, setSelectedCatId] = useState<'eco' | 'comfort' | 'premium'>('comfort');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [passengerTab, setPassengerTab] = useState<'request' | 'schedule' | 'loyalty'>('request');

  // Rating stars and tags state
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingTags, setRatingTags] = useState<string[]>([]);
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');
  
  // Scheduling state
  const [schedDate, setSchedDate] = useState<string>('2026-07-03');
  const [schedTime, setSchedTime] = useState<string>('09:30');
  const [schedAlert, setSchedAlert] = useState<string | null>(null);

  // Loyalty feedback state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  // Calculate distance & price estimate
  const dx = dropoff.x - pickup.x;
  const dy = dropoff.y - pickup.y;
  const distanceKm = Math.max(1.5, parseFloat((Math.sqrt(dx * dx + dy * dy) * 0.3).toFixed(1)));
  const durationMin = Math.max(4, Math.round(distanceKm * 1.8));

  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(dropoff);
    setDropoff(temp);
  };

  const handleRequest = () => {
    const category = RIDE_CATEGORIES.find((c) => c.id === selectedCatId)!;
    onRequestTrip(pickup, dropoff, category);
  };

  const handleCreateSchedule = () => {
    const category = RIDE_CATEGORIES.find((c) => c.id === selectedCatId)!;
    const newSched = onScheduleRide(pickup, dropoff, category, schedDate, schedTime);
    setSchedAlert(`Corrida agendada com sucesso para ${schedDate} às ${schedTime}!`);
    setTimeout(() => setSchedAlert(null), 4000);
  };

  const handleRedeem = (reward: typeof LOYALTY_REWARDS[0]) => {
    if (passengerStats.loyaltyPoints < reward.pointsCost) {
      setRewardToast('Pontos insuficientes para este resgate.');
      setTimeout(() => setRewardToast(null), 3000);
      return;
    }
    const redemption = onRedeemReward(reward);
    if (redemption) {
      setRewardToast(`Resgatado com sucesso! Código: ${redemption.code}`);
      setTimeout(() => setRewardToast(null), 5000);
    }
  };

  const toggleRatingTag = (tag: string) => {
    setRatingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPassengerRating) return;
    onRateDriver(pendingPassengerRating.id, ratingStars, ratingTags);
    // Reset rating form state
    setRatingStars(5);
    setRatingTags([]);
    setFeedbackNotes('');
  };

  const getPriceEstimate = (cat: RideCategory) => {
    const rawTotal = cat.baseFare + (distanceKm * cat.perKm) + (durationMin * cat.perMin);
    // Apply discount
    const discountedTotal = Math.max(2.0, rawTotal - activeDiscount);
    const platformFee = discountedTotal * (cat.platformFeePercent / 100);
    const driverEarnings = discountedTotal - platformFee;
    return {
      rawTotal: parseFloat(rawTotal.toFixed(2)),
      total: parseFloat(discountedTotal.toFixed(2)),
      driverEarnings: parseFloat(driverEarnings.toFixed(2)),
      platformFee: parseFloat(platformFee.toFixed(2)),
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // -------------------------------------------------------------
  // RATING OVERRIDE: If there is a pending passenger rating to give
  // -------------------------------------------------------------
  if (pendingPassengerRating) {
    return (
      <div className="bg-elegant-card border border-elegant-border-high rounded-3xl p-6 shadow-xl space-y-5 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Avaliar Motorista</h2>
              <p className="text-xs text-slate-400">Sua avaliação ajuda a manter a comunidade segura.</p>
            </div>
          </div>

          <form onSubmit={handleRatingSubmit} className="space-y-4">
            {/* Trip brief summary */}
            <div className="bg-elegant-bg p-3.5 rounded-2xl border border-elegant-border text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Motorista:</span>
                <span className="text-white font-bold">Roberto Santos</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Trajeto:</span>
                <span className="text-white font-semibold truncate max-w-[150px]">{pendingPassengerRating.pickupName} &rarr; {pendingPassengerRating.dropoffName}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold border-t border-slate-900 pt-1.5 mt-1.5">
                <span>Pontos Fidelidade Ganhos:</span>
                <span>+{Math.round(pendingPassengerRating.fareTotal)} pts</span>
              </div>
            </div>

            {/* Stars Picker */}
            <div className="text-center py-2">
              <label className="block text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider">Como foi o serviço?</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-400 mt-1.5 block">
                {ratingStars === 5 && 'Excelente (5 estrelas)'}
                {ratingStars === 4 && 'Muito bom (4 estrelas)'}
                {ratingStars === 3 && 'Regular (3 estrelas)'}
                {ratingStars === 2 && 'Ruim (2 estrelas)'}
                {ratingStars === 1 && 'Péssimo (1 estrela)'}
              </span>
            </div>

            {/* Quick Review Tags */}
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Selecione Elogios (Opcional)</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Excelente Papo 💬',
                  'Carro Limpo ✨',
                  'Direção Segura 🛡️',
                  'Super Educado 🤝',
                  'Ar Condicionado ❄️',
                  'Música Ótima 🎵'
                ].map((tag) => {
                  const isSelected = ratingTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleRatingTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-elegant-bg border-elegant-border text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Comentário Adicional</label>
              <textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Escreva algo sobre sua experiência..."
                rows={2}
                className="w-full bg-elegant-bg border border-elegant-border rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 uppercase tracking-wide"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar Avaliação
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE TRIP STATE: Render standard searching/arriving/trip states
  // -------------------------------------------------------------
  if (activeTrip && activeTrip.status !== 'COMPLETED') {
    return (
      <div className="bg-elegant-card border border-elegant-border-high rounded-3xl p-6 shadow-xl space-y-6 h-full flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg animate-pulse">🚗</span>
                Corrida em Curso
              </h2>
              <p className="text-xs text-slate-400 mt-1">Sua segurança é o nosso maior compromisso.</p>
            </div>
          </div>

          {/* Render Active searching/arriving/intrip state */}
          {activeTrip.status === 'SEARCHING' && (
            <div className="text-center py-6 space-y-5">
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-emerald-500 animate-ping opacity-25"></div>
                <div className="absolute inset-2 rounded-full border border-emerald-500/60 animate-ping opacity-40"></div>
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Clock className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white">Procurando Motoristas Parceiros</h3>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Localizando motoristas na região de {activeTrip.pickup.name}. Comissão repassada justa de 90%!
                </p>
              </div>

              <div className="bg-elegant-bg p-3.5 rounded-2xl border border-elegant-border text-left space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Valor Estimado:</span>
                  <span className="text-white font-bold">{activeTrip.fareTotal.toFixed(2)} MT</span>
                </div>
                {activeDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-400">
                    <span>Desconto Aplicado:</span>
                    <span>- {activeDiscount.toFixed(2)} MT</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[11px] text-emerald-400 border-t border-slate-900 pt-2">
                  <span className="flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Repasse do Motorista (90%):
                  </span>
                  <span className="font-bold">{activeTrip.driverEarnings.toFixed(2)} MT</span>
                </div>
              </div>
            </div>
          )}

          {(activeTrip.status === 'ACCEPTED' || activeTrip.status === 'ARRIVING') && (
            <div className="space-y-4">
              <div className="bg-emerald-500/15 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">Motorista Confirmado</span>
                  <h4 className="font-bold text-sm text-white mt-0.5">Roberto Santos</h4>
                  <p className="text-xs text-slate-400">Rating: <span className="text-amber-400 font-bold">⭐ 4.92</span></p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                  RS
                </div>
              </div>

              <div className="bg-elegant-bg p-3 rounded-xl border border-elegant-border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Carro:</span>
                  <span className="text-white font-bold">Toyota Corolla - Prata</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Placa:</span>
                  <span className="text-white font-bold font-mono px-1.5 bg-slate-900 rounded border border-slate-800">AAB-392-MC</span>
                </div>
              </div>

              <div className="bg-elegant-bg/40 p-3.5 rounded-xl border border-elegant-border-high space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">EMBARQUE</span>
                    <span className="text-slate-300 font-medium truncate max-w-[200px] block">{activeTrip.pickup.name}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">DESTINO</span>
                    <span className="text-slate-300 font-medium truncate max-w-[200px] block">{activeTrip.dropoff.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTrip.status === 'IN_TRIP' && (
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Viagem em Andamento</h3>
                <p className="text-xs text-slate-400">Aproveite sua rota confortável de {activeTrip.category.name}.</p>
              </div>

              <div className="bg-elegant-bg p-4 rounded-xl border border-elegant-border text-left space-y-2 max-w-sm mx-auto text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Destino Final:</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[150px]">{activeTrip.dropoff.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Valor Pago:</span>
                  <span className="text-white font-bold">{activeTrip.fareTotal.toFixed(2)} MT</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          {(activeTrip.status === 'SEARCHING' || activeTrip.status === 'ACCEPTED' || activeTrip.status === 'ARRIVING') && (
            <button
              onClick={onCancelTrip}
              className="w-full py-3.5 bg-elegant-bg border border-elegant-border hover:bg-rose-950/20 hover:border-rose-900/40 hover:text-rose-400 text-slate-400 font-bold text-xs rounded-xl transition-all"
            >
              Cancelar Solicitação
            </button>
          )}

          {activeTrip.status === 'IN_TRIP' && (
            <div className="p-3 bg-elegant-bg border border-elegant-border rounded-xl text-center text-[10px] text-slate-500">
              🛡️ Compartilhamento de rota ativa via satélite.
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // IDLE STATE: Rendering the full tabbed passenger experience
  // -------------------------------------------------------------
  return (
    <div className="bg-elegant-card border border-elegant-border-high rounded-3xl p-6 shadow-xl space-y-5 h-full flex flex-col justify-between">
      <div>
        {/* Passenger Profile Overview with rating & points */}
        <div className="flex items-center justify-between border-b border-elegant-border pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
              VC
            </div>
            <div>
              <span className="font-extrabold text-xs text-white block">Você (Passageiro)</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {passengerStats.rating.toFixed(2)}
                </span>
                <span>&bull;</span>
                <span className="text-slate-500 font-semibold">{passengerStats.totalTrips} viagens</span>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
              <Award className="w-3 h-3" />
              {passengerStats.loyaltyPoints >= 500 ? 'Platinum' : passengerStats.loyaltyPoints >= 200 ? 'Gold' : 'Club'}
            </span>
            <span className="text-[10px] text-slate-400 font-bold mt-1 font-mono">{passengerStats.loyaltyPoints} PTS</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-elegant-bg p-1 rounded-xl border border-elegant-border text-[10px] font-bold mb-4">
          <button
            onClick={() => setPassengerTab('request')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
              passengerTab === 'request' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Pedir
          </button>
          <button
            onClick={() => setPassengerTab('schedule')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
              passengerTab === 'schedule' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Agendar
          </button>
          <button
            onClick={() => setPassengerTab('loyalty')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
              passengerTab === 'loyalty' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            Fidelidade
          </button>
        </div>

        {/* Info Alerts (toast simulation) */}
        {rewardToast && (
          <div className="mb-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 p-2.5 rounded-xl text-[10px] leading-snug flex items-center justify-between">
            <span className="font-semibold">{rewardToast}</span>
            <button onClick={() => setRewardToast(null)} className="p-0.5 text-emerald-500 hover:text-emerald-300">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {schedAlert && (
          <div className="mb-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 p-2.5 rounded-xl text-[10px] leading-snug flex items-center justify-between">
            <span className="font-semibold">{schedAlert}</span>
            <button onClick={() => setSchedAlert(null)} className="p-0.5 text-emerald-500 hover:text-emerald-300">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {activeDiscount > 0 && passengerTab === 'request' && (
          <div className="mb-3 bg-indigo-950/40 border border-indigo-800/30 text-indigo-400 p-2.5 rounded-xl text-[10px] font-semibold flex items-center justify-between">
            <span>Desconto ativo acumulado: {activeDiscount.toFixed(2)} MT off no próximo pedido!</span>
            <span className="px-1.5 py-0.5 bg-indigo-500/20 rounded-md">Ativo</span>
          </div>
        )}

        {/* TAB 1: REQUEST A TRIP */}
        {passengerTab === 'request' && (
          <div className="space-y-4">
            {/* Route Selector (Pickup & Dropoff) */}
            <div className="bg-elegant-bg/60 p-4 rounded-2xl border border-elegant-border relative space-y-3">
              {/* Connector line for inputs */}
              <div className="absolute left-7 top-[42px] bottom-[42px] w-0.5 border-l-2 border-dashed border-slate-700"></div>

              {/* Pickup Selection */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                  P
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Local de Embarque</label>
                  <select
                    className="w-full bg-transparent text-xs text-slate-200 focus:outline-none py-1 border-b border-transparent focus:border-slate-800 cursor-pointer"
                    value={pickup.id}
                    onChange={(e) => setPickup(LOCATIONS.find((l) => l.id === e.target.value)!)}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id} className="bg-elegant-card text-slate-200">
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-end pr-4 py-1">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="p-1.5 hover:bg-elegant-header text-slate-400 hover:text-slate-200 rounded-lg border border-elegant-border transition-all bg-elegant-card"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>

              {/* Dropoff Selection */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0">
                  D
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Destino Final</label>
                  <select
                    className="w-full bg-transparent text-xs text-slate-200 focus:outline-none py-1 border-b border-transparent focus:border-slate-800 cursor-pointer"
                    value={dropoff.id}
                    onChange={(e) => setDropoff(LOCATIONS.find((l) => l.id === e.target.value)!)}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id} className="bg-elegant-card text-slate-200" disabled={loc.id === pickup.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Travel Summary Specs */}
            <div className="flex items-center justify-between text-[10px] px-2 text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Duração: <strong>{durationMin} min</strong>
              </span>
              <span className="h-1 w-1 bg-slate-700 rounded-full"></span>
              <span>
                Distância: <strong>{distanceKm} km</strong>
              </span>
            </div>

            {/* Ride Categories Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-1">Selecione a Categoria</label>
              <div className="space-y-2">
                {RIDE_CATEGORIES.map((cat) => {
                  const est = getPriceEstimate(cat);
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-elegant-bg border-emerald-500/80 shadow-md shadow-emerald-500/5'
                          : 'bg-elegant-bg/40 border-elegant-border hover:bg-elegant-bg/80 hover:border-elegant-border-high'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${
                          isSelected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-elegant-card text-slate-400'
                        }`}>
                          {cat.id === 'premium' ? <Star className="w-4 h-4" /> : cat.id === 'comfort' ? <Sparkles className="w-4 h-4 animate-pulse" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-white">{cat.name}</span>
                            <span className="px-1 py-0.5 bg-slate-800 text-slate-300 text-[8px] rounded font-semibold">
                              Repasse 90%
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{cat.description}</span>
                        </div>
                      </div>

                      {/* Pricing block with transparent driver payout */}
                      <div className="text-right">
                        <div className="text-xs font-bold text-white">
                          {activeDiscount > 0 ? (
                            <span className="flex flex-col items-end">
                              <span className="text-[10px] text-slate-500 line-through">{est.rawTotal.toFixed(2)} MT</span>
                              <span>{est.total.toFixed(2)} MT</span>
                            </span>
                          ) : (
                            <span>{est.total.toFixed(2)} MT</span>
                          )}
                        </div>
                        <div className="text-[9px] text-emerald-400 font-semibold">
                          {est.driverEarnings.toFixed(2)} MT ao motorista
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE IN ADVANCE */}
        {passengerTab === 'schedule' && (
          <div className="space-y-4">
            <div className="bg-elegant-bg/60 p-4 rounded-2xl border border-elegant-border space-y-3.5">
              <span className="font-bold text-xs text-white block">Agendar Novo Embarque</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Selecione o Dia</label>
                  <input
                    type="date"
                    min="2026-07-02"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full bg-elegant-card border border-elegant-border p-2 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Horário</label>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full bg-elegant-card border border-elegant-border p-2 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Showcase active locations for schedule */}
              <div className="p-3 bg-elegant-card/50 rounded-xl border border-elegant-border space-y-1.5 text-[11px] text-slate-300">
                <p className="flex items-center gap-1.5 font-semibold text-white">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Trajeto Selecionado:
                </p>
                <div className="pl-5 space-y-0.5">
                  <span className="block truncate">Embarque: <strong>{pickup.name}</strong></span>
                  <span className="block truncate">Destino: <strong>{dropoff.name}</strong></span>
                </div>
              </div>

              <button
                onClick={handleCreateSchedule}
                disabled={pickup.id === dropoff.id}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5 uppercase"
              >
                <Calendar className="w-3.5 h-3.5" />
                Agendar Corrida ({getPriceEstimate(RIDE_CATEGORIES.find((c) => c.id === selectedCatId)!).total.toFixed(2)} MT)
              </button>
            </div>

            {/* List Scheduled rides */}
            <div className="space-y-2.5">
              <span className="font-extrabold text-xs text-slate-400 block px-1">Seus Agendamentos</span>
              {scheduledRides.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-elegant-border rounded-2xl bg-elegant-bg/25 text-xs text-slate-500">
                  Nenhuma viagem agendada no momento.
                </div>
              ) : (
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {scheduledRides.map((sr) => (
                    <div key={sr.id} className="p-3 bg-elegant-bg/80 border border-elegant-border rounded-xl text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-300">{sr.scheduledDate} às {sr.scheduledTime}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          sr.status === 'PENDING' ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400' :
                          sr.status === 'TRIGGERED' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                          'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                        }`}>
                          {sr.status === 'PENDING' && 'Pendente'}
                          {sr.status === 'TRIGGERED' && 'Chamada Ativada'}
                          {sr.status === 'CANCELLED' && 'Cancelado'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-0.5 leading-snug">
                        <p className="truncate">Embarque: <span className="text-white font-medium">{sr.pickup.name}</span></p>
                        <p className="truncate">Destino: <span className="text-white font-medium">{sr.dropoff.name}</span></p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                        <span className="font-bold text-white">{sr.fareTotal.toFixed(2)} MT</span>
                        
                        {sr.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onCancelScheduledRide(sr.id)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all border border-rose-500/20"
                              title="Cancelar Agendamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onTriggerScheduledRide(sr.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[9px] rounded-lg transition-all uppercase tracking-wide flex items-center gap-1"
                            >
                              <Clock className="w-3 h-3 animate-pulse" />
                              Chamar Agora
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LOYALTY CLUB & REWARDS */}
        {passengerTab === 'loyalty' && (
          <div className="space-y-4">
            {/* Loyalty Stats Showcase */}
            <div className="p-4 bg-gradient-to-br from-emerald-950/20 to-slate-950/40 rounded-2xl border border-emerald-500/20 flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Saldo de Fidelidade</span>
                <p className="text-2xl font-black text-white mt-1 font-mono">{passengerStats.loyaltyPoints} <span className="text-xs font-semibold text-slate-400">PTS</span></p>
                <p className="text-[10px] text-slate-400 mt-1">Evolua no clube fazendo corridas justas!</p>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                <Gift className="w-6 h-6 animate-bounce" />
              </div>
            </div>

            {/* Catalog list */}
            <div className="space-y-2">
              <span className="font-extrabold text-xs text-slate-400 block px-1">Catálogo de Prêmios</span>
              <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {LOYALTY_REWARDS.map((rew) => {
                  const canRedeem = passengerStats.loyaltyPoints >= rew.pointsCost;
                  return (
                    <div key={rew.id} className="p-2.5 bg-elegant-bg/80 border border-elegant-border rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{rew.title}</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold rounded">
                            {rew.pointsCost} PTS
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{rew.description}</p>
                      </div>

                      <button
                        onClick={() => handleRedeem(rew)}
                        disabled={!canRedeem}
                        className={`px-3 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-wide transition-all ${
                          canRedeem
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                        }`}
                      >
                        Resgatar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Redemptions Code history */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 px-1 font-extrabold text-xs text-slate-400">
                <History className="w-3.5 h-3.5" />
                <span>Códigos Resgatados</span>
              </div>
              
              {redemptionHistory.length === 0 ? (
                <div className="text-center py-5 border border-dashed border-elegant-border rounded-2xl bg-elegant-bg/25 text-[10px] text-slate-500">
                  Nenhum código gerado ainda. Resgate acima!
                </div>
              ) : (
                <div className="max-h-[110px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {redemptionHistory.map((rh) => (
                    <div key={rh.id} className="p-2 bg-elegant-bg border border-elegant-border rounded-lg flex justify-between items-center text-[10px]">
                      <div>
                        <span className="font-bold text-white block truncate max-w-[130px]">{rh.rewardTitle}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{rh.date} às {rh.time} &bull; -{rh.pointsSpent} pts</span>
                      </div>
                      
                      <button
                        onClick={() => copyToClipboard(rh.code)}
                        className="px-2 py-1 bg-elegant-card hover:bg-elegant-header border border-elegant-border text-slate-300 font-mono font-semibold rounded flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        {copiedCode === rh.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            {rh.code}
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div>
        {passengerTab === 'request' && (
          <button
            onClick={handleRequest}
            disabled={pickup.id === dropoff.id}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-lg hover:shadow-emerald-600/15 flex items-center justify-center gap-1.5 uppercase tracking-wide"
          >
            Confirmar e Pedir Corrida
          </button>
        )}

        {passengerTab === 'schedule' && (
          <div className="p-2 bg-elegant-bg/50 border border-elegant-border rounded-xl text-center text-[10px] text-slate-400">
            ⏰ Os motoristas receberão seu chamado no horário agendado.
          </div>
        )}

        {passengerTab === 'loyalty' && (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-[10px] font-semibold leading-relaxed">
            🌿 Corridas com taxa menor significam sustentabilidade e prêmios maiores!
          </div>
        )}
      </div>
    </div>
  );
};
