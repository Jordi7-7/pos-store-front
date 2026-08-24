import React, { useState } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import { Building2, User, MapPin, Store, Lock, Mail, Landmark, Coins, ArrowRight, Loader2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, onboard } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'login' | 'onboard'>('login');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [workflowMode, setWorkflowMode] = useState<'admin' | 'store'>('store');

  // Onboarding Form State
  const [businessName, setBusinessName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [country, setCountry] = useState('Ecuador');
  const [currency, setCurrency] = useState('USD');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [isOnboardLoading, setIsOnboardLoading] = useState(false);
  const [onboardError, setOnboardError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Por favor complete todos los campos.');
      return;
    }
    setLoginError('');
    setIsLoginLoading(true);
    try {
      const success = await login(loginEmail, loginPassword, workflowMode);
      if (!success) {
        setLoginError('Credenciales incorrectas.');
      }
    } catch (err) {
      setLoginError('Ocurrió un error en el inicio de sesión.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !businessName ||
      !taxId ||
      !adminName ||
      !adminEmail ||
      !adminPassword ||
      !branchName ||
      !branchAddress
    ) {
      setOnboardError('Por favor complete todos los campos obligatorios.');
      return;
    }
    setOnboardError('');
    setIsOnboardLoading(true);
    try {
      const success = await onboard({
        businessName,
        taxId,
        country,
        currency,
        adminName,
        adminEmail,
        adminPassword,
        branchName,
        branchAddress,
      });
      if (!success) {
        setOnboardError('No se pudo registrar el negocio. Intente nuevamente.');
      }
    } catch (err) {
      setOnboardError('Ocurrió un error al procesar el registro.');
    } finally {
      setIsOnboardLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl bg-bg-card border border-border-card rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* Left Side Panel - Info / Welcome */}
        <div className="md:w-5/12 bg-linear-to-br from-primary/5 via-tertiary to-bg-dark p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border-card">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-secondary block">POS STORE</span>
                <span className="text-[10px] text-primary font-semibold uppercase tracking-widest">SaaS ERP Multi-tenant</span>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-secondary leading-tight">
                Gestión total de tu negocio en tiempo real.
              </h2>
              <p className="text-neutral text-sm leading-relaxed">
                Control de inventarios por variantes, múltiples sucursales, cajas registradoras, compras y ventas automatizadas en una sola plataforma.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border-card hidden md:block">
            <div className="flex items-center gap-3 text-xs text-neutral">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Conexión establecida con Nodo ERP</span>
            </div>
          </div>
        </div>

        {/* Right Side Panel - Forms */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          {/* Tab Selector */}
          <div className="flex bg-bg-dark p-1 rounded-xl mb-8 border border-border-card">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-neutral hover:text-secondary'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setActiveTab('onboard')}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'onboard'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-neutral hover:text-secondary'
              }`}
            >
              Registrar Negocio
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-secondary mb-1">Bienvenido de nuevo</h3>
                <p className="text-xs text-neutral">Ingresa tus credenciales para acceder a tu panel.</p>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                  {loginError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1.5">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@minegocio.com"
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 pl-10 pr-4 text-sm text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 pl-10 pr-4 text-sm text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Workflow mode selector */}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-neutral mb-2">Destino de Ingreso</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label 
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        workflowMode === 'store' 
                          ? 'border-primary bg-primary/5 text-secondary' 
                          : 'border-border-card hover:border-neutral/40 text-neutral'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="workflow" 
                        value="store" 
                        checked={workflowMode === 'store'}
                        onChange={() => setWorkflowMode('store')}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-secondary">Modo Tienda (POS)</span>
                      <span className="text-[10px] text-neutral/70 mt-0.5">Habilita PIN de Cajeros</span>
                    </label>

                    <label 
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        workflowMode === 'admin' 
                          ? 'border-primary bg-primary/5 text-secondary' 
                          : 'border-border-card hover:border-neutral/40 text-neutral'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="workflow" 
                        value="admin" 
                        checked={workflowMode === 'admin'}
                        onChange={() => setWorkflowMode('admin')}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-secondary">Panel Control</span>
                      <span className="text-[10px] text-neutral/70 mt-0.5">Acceso administrativo directo</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-primary/15 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
              >
                {isLoginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Onboarding Form */
            <form onSubmit={handleOnboardSubmit} className="space-y-6 max-h-[480px] overflow-y-auto pr-1">
              <div>
                <h3 className="text-xl font-bold text-secondary mb-1">Registrar Nuevo Negocio</h3>
                <p className="text-xs text-neutral">Configure los datos iniciales para desplegar su instancia Tenant ERP.</p>
              </div>

              {onboardError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                  {onboardError}
                </div>
              )}

              {/* Sección A: Datos del Negocio */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider pb-1 border-b border-border-card">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Información del Negocio</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral mb-1">Nombre Comercial *</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Mi Empresa S.A."
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral mb-1">Documento Identidad (RUC) *</label>
                    <input
                      type="text"
                      required
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="1792837482001"
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral mb-1">País</label>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral" />
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-9 pr-3 text-xs text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 appearance-none"
                      >
                        <option value="Ecuador">Ecuador</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Perú">Perú</option>
                        <option value="México">México</option>
                        <option value="USA">USA</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral mb-1">Moneda Principal</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral" />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-9 pr-3 text-xs text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 appearance-none"
                      >
                        <option value="USD">Dólar Americano (USD)</option>
                        <option value="COP">Peso Colombiano (COP)</option>
                        <option value="PEN">Sol Peruano (PEN)</option>
                        <option value="MXN">Peso Mexicano (MXN)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección B: Administrador */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider pb-1 border-b border-border-card">
                  <User className="w-3.5 h-3.5" />
                  <span>Cuenta del Administrador (Dueño)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-neutral mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Jordi Torres"
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="jordi@minegocio.com"
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral mb-1">Contraseña *</label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Sección C: Sucursal */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider pb-1 border-b border-border-card">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Sucursal Inicial</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral mb-1">Nombre Sucursal *</label>
                    <input
                      type="text"
                      required
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="Matriz Norte"
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral mb-1">Dirección Completa *</label>
                    <input
                      type="text"
                      required
                      value={branchAddress}
                      onChange={(e) => setBranchAddress(e.target.value)}
                      placeholder="Av. Amazonas y Colón"
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isOnboardLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-primary/15 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
              >
                {isOnboardLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creando Instancia Tenant...</span>
                  </>
                ) : (
                  <>
                    <span>Dar de Alta y Configurar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
