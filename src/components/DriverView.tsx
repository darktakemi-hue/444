import React, { useState } from 'react';
import { Location, RideCategory, Trip, DriverStats, CompletedTrip, CashoutHistory } from '../types';
import { RIDE_CATEGORIES } from '../constants';
import { 
  TrendingUp, DollarSign, Wallet, Star, Calendar, Clock, ArrowRight, 
  ArrowUpRight, BarChart2, MapPin, Smartphone, CheckCircle, ChevronRight, 
  Calculator, RefreshCw, X, Shield, Percent, Landmark, Check
} from 'lucide-react';

interface DriverViewProps {
  activeTrip: Trip | null;
  driverStats: DriverStats;
  completedTrips: CompletedTrip[];
  cashoutHistory: CashoutHistory[];
  onAcceptTrip: () => void;
  onRejectTrip: () => void;
  onStartTrip: () => void;
  onFinishTrip: (tipAmount: number) => void;
  onConfirmArrival: () => void;
  onCashout: (amount: number, pixKey: string) => boolean;
  pendingDriverRating: CompletedTrip | null;
  onRatePassenger: (tripId: string, rating: number, tags: string[]) => void;
}

export const DriverView: React.FC<DriverViewProps> = ({
  activeTrip,
  driverStats,
  completedTrips,
  cashoutHistory,
  onAcceptTrip,
  onRejectTrip,
  onStartTrip,
  onFinishTrip,
  onConfirmArrival,
  onCashout,
  pendingDriverRating,
  onRatePassenger,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'wallet' | 'simulator'>('overview');
  const [selectedReceipt, setSelectedReceipt] = useState<CompletedTrip | null>(null);
  
  // Simulation Slider State
  const [monthlyGrossRevenue, setMonthlyGrossRevenue] = useState(50000);
  
  // Cashout Modal State
  const [cashoutAmount, setCashoutAmount] = useState<string>('');
  const [pixKey, setPixKey] = useState<string>('');
  const [pixType, setPixType] = useState<'cpf' | 'phone' | 'email'>('cpf');
  const [cashoutStatus, setCashoutStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Tip Selector for finishing trip
  const [simulatedTip, setSimulatedTip] = useState<number>(0);

  // Passenger rating submission states
  const [passengerStars, setPassengerStars] = useState<number>(5);
  const [passengerRatingTags, setPassengerRatingTags] = useState<string[]>([]);

  const togglePassengerTag = (tag: string) => {
    setPassengerRatingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handlePassengerRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingDriverRating) return;
    onRatePassenger(pendingDriverRating.id, passengerStars, passengerRatingTags);
    // Reset rating states
    setPassengerStars(5);
    setPassengerRatingTags([]);
  };

  // Compute fee savings compared to 25% standard competitor fee
  const computeSavings = (gross: number) => {
    const competitorFee = gross * 0.25;
    const driveFairFee = gross * 0.10;
    return {
      competitorKeep: gross - competitorFee,
      driveFairKeep: gross - driveFairFee,
      extraProfit: competitorFee - driveFairFee,
    };
  };

  const savings = computeSavings(monthlyGrossRevenue);

  const handleCashoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(cashoutAmount);
    if (isNaN(amount) || amount <= 0 || amount > driverStats.walletBalance) {
      setCashoutStatus('error');
      return;
    }
    
    setCashoutStatus('loading');
    setTimeout(() => {
      const success = onCashout(amount, pixKey);
      if (success) {
        setCashoutStatus('success');
        setCashoutAmount('');
      } else {
        setCashoutStatus('error');
      }
    }, 1500);
  };

  if (pendingDriverRating) {
    return (
      <div className="bg-elegant-card border border-elegant-border-high rounded-3xl p-6 shadow-xl space-y-5 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl shrink-0">
              <Star className="w-6 h-6 fill-indigo-400 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Avaliar Passageiro</h2>
              <p className="text-xs text-slate-400">Ajude a manter a plataforma respeitosa e justa.</p>
            </div>
          </div>

          <form onSubmit={handlePassengerRatingSubmit} className="space-y-4">
            <div className="bg-elegant-bg p-3.5 rounded-2xl border border-elegant-border text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Passageiro:</span>
                <span className="text-white font-bold">{pendingDriverRating.passengerName === 'Você' ? 'Você (Passageiro)' : pendingDriverRating.passengerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Trajeto:</span>
                <span className="text-white font-semibold truncate max-w-[150px]">{pendingDriverRating.pickupName} &rarr; {pendingDriverRating.dropoffName}</span>
              </div>
            </div>

            {/* Stars Picker */}
            <div className="text-center py-2">
              <label className="block text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider">Como foi o passageiro?</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPassengerStars(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= passengerStars ? 'fill-indigo-400 text-indigo-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-indigo-400 mt-1.5 block">
                {passengerStars === 5 && 'Excelente (5 estrelas)'}
                {passengerStars === 4 && 'Muito bom (4 estrelas)'}
                {passengerStars === 3 && 'Regular (3 estrelas)'}
                {passengerStars === 2 && 'Ruim (2 estrelas)'}
                {passengerStars === 1 && 'Péssimo (1 estrela)'}
              </span>
            </div>

            {/* Quick Review Tags */}
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Selecione Características (Opcional)</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Educado & Gentil 🤝',
                  'Pontual no Ponto ⏰',
                  'Fácil de Localizar 📍',
                  'Conversa Agradável 💬',
                  'Super Respeitoso 🛡️'
                ].map((tag) => {
                  const isSelected = passengerRatingTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => togglePassengerTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                          : 'bg-elegant-bg border-elegant-border text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 uppercase tracking-wide"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Enviar Avaliação do Passageiro
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-elegant-card border border-elegant-border-high rounded-3xl p-6 shadow-xl space-y-6 h-full flex flex-col justify-between">
      <div>
        {/* Header Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-elegant-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">💼</span>
              Painel do Motorista
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Gestão de ganhos em tempo real e taxas de intermediação reduzidas.</p>
          </div>
          
          <div className="flex bg-elegant-bg p-1 rounded-xl border border-elegant-border self-start md:self-auto text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Geral
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                activeTab === 'simulator' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Calculadora
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Histórico
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                activeTab === 'wallet' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Carteira (M-Pesa)
            </button>
          </div>
        </div>

        {/* --- TAB 1: OVERVIEW & GENERAL --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 mt-5">
            {/* Quick stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-elegant-bg p-3.5 rounded-2xl border border-elegant-border">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Hoje (Líquido)</span>
                <span className="text-lg font-extrabold text-white block mt-1">{driverStats.todayEarnings.toFixed(2)} MT</span>
                <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
                  <TrendingUp className="w-2.5 h-2.5" /> 10% de taxa padrão
                </span>
              </div>
              <div className="bg-elegant-bg p-3.5 rounded-2xl border border-elegant-border">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Saldo Carteira</span>
                <span className="text-lg font-extrabold text-indigo-400 block mt-1">{driverStats.walletBalance.toFixed(2)} MT</span>
                <span onClick={() => setActiveTab('wallet')} className="text-[9px] text-indigo-300 hover:underline cursor-pointer block mt-1">
                  Sacar via M-Pesa &rarr;
                </span>
              </div>
              <div className="bg-elegant-bg p-3.5 rounded-2xl border border-elegant-border">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Avaliação</span>
                <span className="text-lg font-extrabold text-white block mt-1 flex items-center gap-1">
                  {driverStats.rating.toFixed(2)} <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </span>
                <span className="text-[9px] text-slate-500 block mt-1">Excelente perfil</span>
              </div>
              <div className="bg-elegant-bg p-3.5 rounded-2xl border border-elegant-border">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Aceitação</span>
                <span className="text-lg font-extrabold text-white block mt-1">{(driverStats.acceptanceRate * 100).toFixed(0)}%</span>
                <span className="text-[9px] text-slate-500 block mt-1">Últimas 50 corridas</span>
              </div>
            </div>

            {/* Simulated Live Chart (Drawn beautifully with Custom Responsive SVG) */}
            <div className="bg-elegant-bg p-5 rounded-2xl border border-elegant-border">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Histórico Semanal de Ganhos</h4>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> DriveFair (Líquido)
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="w-2 h-2 rounded bg-slate-700"></span> Perda de Outros Apps
                  </span>
                </div>
              </div>

              {/* Custom SVG Bar Chart comparing DriveFair vs Competitors */}
              <div className="w-full h-40">
                <svg className="w-full h-full" viewBox="0 0 400 150">
                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="380" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="30" y1="60" x2="380" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="30" y1="100" x2="380" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="30" y1="120" x2="380" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

                  {/* Y-Axis Labels */}
                  <text x="5" y="24" fill="#64748b" fontSize="8" fontFamily="monospace">3000 MT</text>
                  <text x="5" y="64" fill="#64748b" fontSize="8" fontFamily="monospace">1500 MT</text>
                  <text x="5" y="104" fill="#64748b" fontSize="8" fontFamily="monospace">500 MT</text>
                  <text x="12" y="124" fill="#64748b" fontSize="8" fontFamily="monospace">0</text>

                  {/* Bars & X-Axis Labels */}
                  {[
                    { label: 'Seg', driveFair: 1200, competitor: 900 },
                    { label: 'Ter', driveFair: 1800, competitor: 1350 },
                    { label: 'Qua', driveFair: 1400, competitor: 1050 },
                    { label: 'Qui', driveFair: 2100, competitor: 1575 },
                    { label: 'Sex', driveFair: 2450, competitor: 1837 },
                    { label: 'Sáb', driveFair: 2700, competitor: 2025 },
                    { label: 'Dom', driveFair: 1900, competitor: 1425 },
                  ].map((day, idx) => {
                    const x = 50 + idx * 46;
                    
                    // Heights (max 100px relative to 120 base line)
                    const dfHeight = (day.driveFair / 3000) * 100;
                    const compHeight = (day.competitor / 3000) * 100;
                    
                    const dfY = 120 - dfHeight;
                    const compY = 120 - compHeight;

                    return (
                      <g key={day.label} className="group cursor-pointer">
                        {/* Redundant losses in grey background (representing competitor cuts) */}
                        <rect
                          x={x}
                          y={compY}
                          width="12"
                          height={dfHeight - compHeight}
                          fill="#f43f5e"
                          opacity="0.35"
                          rx="1"
                        />
                        {/* Actual driver earnings under DriveFair (In Blue/Indigo) */}
                        <rect
                          x={x}
                          y={dfY}
                          width="12"
                          height={compHeight}
                          fill="#6366f1"
                          rx="1.5"
                          className="transition-all duration-300 hover:fill-emerald-400"
                        />
                        
                        {/* Interactive values */}
                        <text x={x - 8} y={dfY - 4} fill="#ffffff" fontSize="7.5" fontWeight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity bg-elegant-card">
                          {day.driveFair} MT
                        </text>
                        
                        {/* Day label */}
                        <text x={x - 2} y="134" fill="#64748b" fontSize="8" fontWeight="bold">
                          {day.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Extra explanation on the chart */}
              <div className="flex items-center gap-2.5 mt-2 p-3 bg-indigo-950/20 rounded-xl border border-indigo-900/20 text-xs text-indigo-300">
                <Percent className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Com a taxa reduzida de <strong>10%</strong> da DriveFair (vs <strong>25%</strong> dos concorrentes), você economizou <strong>5.200,00 MT</strong> adicionais esta semana!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: CALCULATOR & INCOME COMPARISON SIMULATOR --- */}
        {activeTab === 'simulator' && (
          <div className="space-y-5 mt-5">
            <div className="bg-elegant-bg p-4 rounded-2xl border border-elegant-border space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  Simulador de Ganhos Reais
                </h4>
                <span className="px-2.5 py-1 bg-elegant-card border border-elegant-border text-slate-300 rounded-lg text-xs font-bold">
                  Comissão: 10%
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Arraste o slider para ajustar o seu <strong>faturamento bruto mensal estimado</strong> e compare o valor líquido final no seu bolso.
              </p>

              {/* Slider Input */}
              <div className="space-y-2 py-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400">Faturamento Bruto Mensal:</span>
                  <span className="text-base font-extrabold text-white">{monthlyGrossRevenue.toLocaleString('pt-PT')} MT</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="150000"
                  step="5000"
                  value={monthlyGrossRevenue}
                  onChange={(e) => setMonthlyGrossRevenue(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Dynamic comparison columns */}
              <div className="grid grid-cols-2 gap-3.5 pt-2">
                {/* Competitor Column */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/5 rotate-45 transform translate-x-4 -translate-y-4"></div>
                  <span className="text-rose-400 font-bold block">Apps Tradicionais</span>
                  <p className="text-[10px] text-slate-500">Taxa de intermediação: ~25%</p>
                  
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Você recebe líquido:</span>
                    <span className="text-base font-bold text-slate-300">{savings.competitorKeep.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT</span>
                  </div>
                  
                  <div className="text-[10px] text-rose-400/80 bg-rose-950/15 p-1.5 rounded border border-rose-900/10">
                    Taxa retida: {(monthlyGrossRevenue * 0.25).toLocaleString('pt-PT')} MT
                  </div>
                </div>

                {/* DriveFair Column */}
                <div className="bg-emerald-950/10 p-3.5 rounded-xl border border-emerald-500/20 text-xs space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rotate-45 transform translate-x-4 -translate-y-4"></div>
                  <span className="text-emerald-400 font-bold block flex items-center gap-1">
                    DriveFair 
                    <Shield className="w-3 h-3 text-emerald-400" />
                  </span>
                  <p className="text-[10px] text-slate-400">Taxa de intermediação: <strong>Apenas 10%</strong></p>
                  
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Você recebe líquido:</span>
                    <span className="text-base font-extrabold text-white">{savings.driveFairKeep.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT</span>
                  </div>
                  
                  <div className="text-[10px] text-emerald-400 bg-emerald-950/30 p-1.5 rounded border border-emerald-800/20">
                    Taxa retida: {(monthlyGrossRevenue * 0.10).toLocaleString('pt-PT')} MT
                  </div>
                </div>
              </div>

              {/* Extra profit visual showcase */}
              <div className="bg-emerald-600/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium">Seu lucro extra mensal com a DriveFair:</span>
                  <p className="text-sm font-extrabold text-emerald-400">
                    + {savings.extraProfit.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT / mês
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: HISTORY & TRANSPARENT RECEIPTS --- */}
        {activeTab === 'history' && (
          <div className="space-y-4 mt-5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider px-1">Registros de Viagens Realizadas</h4>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {completedTrips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => setSelectedReceipt(trip)}
                  className="p-3 bg-elegant-bg hover:bg-elegant-bg/80 border border-elegant-border hover:border-elegant-border-high rounded-xl flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-xl">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{trip.passengerName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-900 text-slate-400 border border-slate-800 rounded">
                          {trip.categoryName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {trip.date} às {trip.time} &bull; {trip.distanceKm}km
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-emerald-400 block">{(trip.driverEarnings + trip.tip).toFixed(2)} MT</span>
                      <span className="text-[9px] text-slate-500 block">Líquido final</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Transparent Receipt Modal */}
            {selectedReceipt && (
              <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-elegant-card border border-elegant-border-high p-6 rounded-3xl max-w-sm w-full space-y-4 relative shadow-2xl">
                  <button 
                    onClick={() => setSelectedReceipt(null)}
                    className="absolute top-4 right-4 p-1.5 bg-elegant-bg border border-elegant-border hover:text-white rounded-lg text-slate-400 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="text-center space-y-1 pb-2 border-b border-elegant-border">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Recibo Detalhado Transparente</span>
                    <h3 className="font-extrabold text-white text-base">Viagem #{selectedReceipt.id}</h3>
                    <p className="text-xs text-slate-500">{selectedReceipt.date} às {selectedReceipt.time}</p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Passageiro:</span>
                      <span className="text-white font-bold">{selectedReceipt.passengerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Distância / Duração:</span>
                      <span className="text-white">{selectedReceipt.distanceKm} km / {selectedReceipt.durationMin} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Categoria de Serviço:</span>
                      <span className="text-white">{selectedReceipt.categoryName}</span>
                    </div>
                    
                    <div className="border-t border-dashed border-slate-800 pt-2.5 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tarifa Bruta de Viagem:</span>
                        <span className="text-white font-semibold">{selectedReceipt.fareTotal.toFixed(2)} MT</span>
                      </div>
                      
                      {/* Standard 10% fee subtraction */}
                      <div className="flex justify-between text-rose-400">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5" />
                          Taxa de Intermediação (10%):
                        </span>
                        <span>- {selectedReceipt.platformFeeAmount.toFixed(2)} MT</span>
                      </div>

                      {/* 100% tip forward */}
                      {selectedReceipt.tip > 0 && (
                        <div className="flex justify-between text-emerald-400 font-medium">
                          <span>Gorjeta Extra (100% repassada):</span>
                          <span>+ {selectedReceipt.tip.toFixed(2)} MT</span>
                        </div>
                      )}
                    </div>

                    {/* Compare with Competitors in transparent receipt */}
                    <div className="bg-elegant-bg p-3 rounded-xl border border-elegant-border space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Repasse na concorrência (~25%):</span>
                        <span className="text-slate-400 font-semibold strike-through line-through">{selectedReceipt.competitorEarnings.toFixed(2)} MT</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-emerald-400">
                        <span>Seu Ganho DriveFair (90%):</span>
                        <span>{(selectedReceipt.driverEarnings + selectedReceipt.tip).toFixed(2)} MT</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm font-bold">
                      <span className="text-white uppercase tracking-wider text-[11px]">Seu Ganho Líquido:</span>
                      <span className="text-lg text-emerald-400">{(selectedReceipt.driverEarnings + selectedReceipt.tip).toFixed(2)} MT</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedReceipt(null)}
                    className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Fechar Recibo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 4: WALLET & PIX CASHOUT --- */}
        {activeTab === 'wallet' && (
          <div className="space-y-4 mt-5">
            <div className="bg-elegant-bg p-4 rounded-2xl border border-elegant-border space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Saldo para Saque</span>
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded-full font-bold uppercase tracking-wider">
                  Transferência Móvel Instantânea
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-white">{driverStats.walletBalance.toFixed(2)} MT</span>
                <p className="text-[10px] text-slate-500 mt-1">Disponível para transferência bancária imediata a qualquer momento.</p>
              </div>
            </div>

            {/* Pix Cashout Form */}
            <form onSubmit={handleCashoutSubmit} className="bg-elegant-bg p-4.5 rounded-2xl border border-elegant-border space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Solicitar Transferência Móvel</span>
              
              <div className="grid grid-cols-3 gap-2 pb-1 text-center text-[10px] font-bold">
                {['M-Pesa', 'e-Mola', 'mKeshe'].map((type, idx) => {
                  const keyType = idx === 0 ? 'cpf' : idx === 1 ? 'phone' : 'email';
                  const isSel = pixType === keyType;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPixType(keyType)}
                      className={`py-1.5 rounded-lg border transition-all ${
                        isSel ? 'bg-indigo-600/15 border-indigo-500/60 text-indigo-300' : 'bg-slate-900 border-transparent text-slate-500'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={pixType === 'cpf' ? '84 XXX XXXX (M-Pesa)' : pixType === 'phone' ? '86 XXX XXXX (e-Mola)' : '82 XXX XXXX (mKeshe)'}
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor do Saque (MT)"
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    required
                    max={driverStats.walletBalance}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setCashoutAmount(driverStats.walletBalance.toString())}
                    className="absolute right-3 top-2.5 text-[9px] bg-slate-800 hover:bg-slate-700 text-indigo-400 font-bold px-2 py-1 rounded"
                  >
                    MÁXIMO
                  </button>
                </div>
              </div>

              {/* Status responses */}
              {cashoutStatus === 'success' && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Transferência efetuada com sucesso!
                </div>
              )}

              {cashoutStatus === 'error' && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center text-[10px] text-rose-400 font-semibold">
                  Erro: Saldo insuficiente ou conta móvel inválida.
                </div>
              )}

              <button
                type="submit"
                disabled={cashoutStatus === 'loading' || driverStats.walletBalance <= 0 || !pixKey}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                {cashoutStatus === 'loading' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Processando via Conta Móvel...
                  </>
                ) : (
                  <>
                    <Landmark className="w-3.5 h-3.5" />
                    Solicitar Saque Imediato
                  </>
                )}
              </button>
            </form>

            {/* Withdraw History Log */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Histórico de Resgates</span>
              <div className="bg-elegant-bg rounded-2xl border border-elegant-border divide-y divide-slate-900 max-h-28 overflow-y-auto">
                {cashoutHistory.length === 0 ? (
                  <div className="p-3 text-center text-[10px] text-slate-600">Nenhum saque efetuado ainda.</div>
                ) : (
                  cashoutHistory.map((log) => (
                    <div key={log.id} className="p-2.5 flex justify-between items-center text-[10px]">
                      <div>
                        <span className="text-white font-medium">Conta Móvel: {log.pixKey}</span>
                        <span className="text-slate-500 block mt-0.5">{log.date} às {log.time}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-white">{log.amount.toFixed(2)} MT</span>
                        <span className="text-[9px] text-emerald-400 block font-semibold mt-0.5">{log.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ACTIVE RIDE SYSTEM MODAL/OVERLAYS FOR DRIVER INTERACTION --- */}
        {/* State A: Alert pop-up when passenger requested a ride (searching) */}
        {activeTrip && activeTrip.status === 'SEARCHING' && (
          <div className="mt-5 p-4 bg-indigo-950/20 border-2 border-indigo-500/40 rounded-2xl space-y-4 animate-pulse relative">
            <div className="absolute -top-2.5 left-5 bg-indigo-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-400">
              Nova Viagem Solicitada Próxima
            </div>

            <div className="flex justify-between items-start pt-1">
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-white">{activeTrip.passengerName}</h4>
                  <span className="flex items-center text-[10px] text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" /> {activeTrip.passengerRating}
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-950 border border-indigo-900/60 text-indigo-300 font-bold rounded mt-1 inline-block">
                  {activeTrip.category.name}
                </span>
              </div>
              
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Você Ganha (90%):</span>
                <span className="text-lg font-black text-emerald-400">{activeTrip.driverEarnings.toFixed(2)} MT</span>
              </div>
            </div>

            <div className="bg-elegant-bg p-3 rounded-xl border border-elegant-border space-y-2 text-xs">
              <div className="flex items-start gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                <div className="truncate text-slate-300">
                  <strong className="text-slate-500 text-[9px] block uppercase">Embarque:</strong>
                  {activeTrip.pickup.name}
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <div className="truncate text-slate-300">
                  <strong className="text-slate-500 text-[9px] block uppercase">Destino:</strong>
                  {activeTrip.dropoff.name}
                </div>
              </div>
            </div>

            {/* Show Platform fee transparency upfront for the driver */}
            <div className="flex justify-between items-center text-[10px] text-indigo-300 border-t border-indigo-900/30 pt-2.5">
              <span>Faturamento Total: {activeTrip.fareTotal.toFixed(2)} MT</span>
              <span className="font-medium bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/40">
                Taxa DriveFair: {activeTrip.platformFeeAmount.toFixed(2)} MT (Apenas 10%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1.5">
              <button
                onClick={onRejectTrip}
                className="py-3 bg-slate-950 hover:bg-rose-950/20 hover:border-rose-900/40 border border-slate-800 text-slate-400 hover:text-rose-400 font-bold text-xs rounded-xl transition-all"
              >
                Recusar
              </button>
              <button
                onClick={onAcceptTrip}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/10"
              >
                Aceitar Corrida (90% Cut)
              </button>
            </div>
          </div>
        )}

        {/* State B: Active accepted trip - Driver heading to Passenger */}
        {activeTrip && (activeTrip.status === 'ACCEPTED' || activeTrip.status === 'ARRIVING') && (
          <div className="mt-5 p-4 bg-elegant-bg border border-elegant-border rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded-full font-bold uppercase tracking-wider">
                  {activeTrip.status === 'ACCEPTED' ? 'Corrida Aceita' : 'A Caminho do Passageiro'}
                </span>
                <h4 className="font-bold text-sm text-white mt-1.5">Buscando {activeTrip.passengerName}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Tarifa Líquida:</span>
                <span className="font-extrabold text-emerald-400 text-base">{activeTrip.driverEarnings.toFixed(2)} MT</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl space-y-1 text-xs border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Local de Embarque:</span>
              <p className="text-slate-300 font-medium">{activeTrip.pickup.name}</p>
            </div>

            {/* Quick manual triggers to simulate physical actions easily */}
            <div className="pt-2">
              {activeTrip.status === 'ACCEPTED' ? (
                <button
                  onClick={onConfirmArrival}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Confirmar Chegada no Embarque
                </button>
              ) : (
                <button
                  onClick={onStartTrip}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Iniciar Viagem (Passageiro a bordo)
                </button>
              )}
            </div>
          </div>
        )}

        {/* State C: On-Trip State - Driver navigating to Destination */}
        {activeTrip && activeTrip.status === 'IN_TRIP' && (
          <div className="mt-5 p-4 bg-elegant-bg border border-elegant-border rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full font-bold uppercase tracking-wider">
                  Viagem em Curso
                </span>
                <h4 className="font-bold text-sm text-white mt-1.5">Levando {activeTrip.passengerName}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Tarifa Líquida:</span>
                <span className="font-extrabold text-emerald-400 text-base">{activeTrip.driverEarnings.toFixed(2)} MT</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl space-y-1 text-xs border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Destino do Passageiro:</span>
              <p className="text-slate-300 font-medium">{activeTrip.dropoff.name}</p>
            </div>

            {/* Tip Option Simulator for finalizing */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/60 space-y-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Simulador de Gorjeta (100% Repassada):</span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                {[0, 50, 100, 200].map((tipVal) => {
                  const isSel = simulatedTip === tipVal;
                  return (
                    <button
                      key={tipVal}
                      type="button"
                      onClick={() => setSimulatedTip(tipVal)}
                      className={`py-1 rounded-md border transition-all ${
                        isSel ? 'bg-emerald-600/20 border-emerald-500/80 text-emerald-300' : 'bg-slate-950 border-transparent text-slate-500'
                      }`}
                    >
                      {tipVal === 0 ? 'Sem' : `+${tipVal} MT`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger to finalize the active trip */}
            <button
              onClick={() => {
                onFinishTrip(simulatedTip);
                setSimulatedTip(0); // Reset local selection
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Finalizar Viagem & Receber Valor
            </button>
          </div>
        )}
      </div>

      {/* Footer warning */}
      <div className="mt-5 text-center text-[10px] text-slate-500 border-t border-slate-800/60 pt-4 flex items-center justify-center gap-1">
        <Shield className="w-3.5 h-3.5 text-slate-500" />
        Previsões fiscais e operacionais asseguradas por DriveFair Ltd.
      </div>
    </div>
  );
};
