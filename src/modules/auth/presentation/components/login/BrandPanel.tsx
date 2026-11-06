import React, { useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import { localeForCountry } from '@/shared/domain/rules/format-money';

interface BrandPanelProps {
  /** Tienda ya elegida: muestra su logo y nombre y la hora local; sin tienda, la presentación general de la app. */
  tenant: { name: string; slug: string; logoUrl: string | null; timezone: string; country: string } | null;
  onChangeTenant?: () => void;
}

/** Hora y fecha de la tienda, para que el cajero vea de un vistazo que la terminal está lista. */
const LiveClock: React.FC<{ timezone: string; country: string }> = ({ timezone, country }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);
  const time = now.toLocaleTimeString(localeForCountry(country), { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString(localeForCountry(country), { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div>
      <p className="font-mono text-5xl font-light tracking-tight text-brand-secondary xl:text-6xl">{time}</p>
      <p className="mt-2 text-base text-zinc-400 first-letter:uppercase">{date}</p>
    </div>
  );
};

/** Ilustración abstracta de un ticket y un gráfico (sin cifras reales): da vida al panel sin inventar datos del negocio. */
const Showcase: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none relative h-64 w-full max-w-md select-none">
    <div className="absolute bottom-0 left-0 w-56 rotate-[-4deg] rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-sm animate-float-soft [--tilt:-4deg]">
      <div className="mb-4 flex items-center gap-2">
        <span className="size-2 rounded-full bg-emerald-400" />
        <span className="h-2 w-20 rounded-full bg-white/30" />
      </div>
      {[70, 52, 62, 40].map((width, index) => (
        <div key={index} className="mb-2.5 flex items-center justify-between gap-3">
          <span className="h-1.5 rounded-full bg-white/20" style={{ width: `${width}%` }} />
          <span className="h-1.5 w-8 rounded-full bg-white/25" />
        </div>
      ))}
      <div className="mt-4 flex items-center justify-between border-t border-dashed border-white/20 pt-3">
        <span className="h-2 w-12 rounded-full bg-white/30" />
        <span className="h-3 w-16 rounded-full bg-brand-secondary/80" />
      </div>
    </div>

    <div className="absolute right-0 top-0 w-60 rotate-[3deg] rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-sm animate-float-soft [--tilt:3deg] [animation-delay:-3s]">
      <div className="mb-3 flex items-end justify-between">
        <span className="h-2 w-16 rounded-full bg-white/30" />
        <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300">en tiempo real</span>
      </div>
      <div className="flex h-24 items-end gap-2">
        {[38, 56, 44, 72, 60, 88, 66].map((height, index) => (
          <span key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-secondary/30 to-brand-secondary/80" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  </div>
);

/** Panel de marca de las pantallas de acceso: oscuro, con la identidad de la tienda o de la app. */
export const BrandPanel: React.FC<BrandPanelProps> = ({ tenant, onChangeTenant }) => (
  <aside className="relative flex flex-col justify-between overflow-hidden bg-[#0f0f10] px-6 py-6 text-zinc-300 sm:px-10 lg:min-h-screen lg:w-[52%] lg:px-14 lg:py-12">
    {/* Fondo: brillo cálido y trama fina */}
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -left-24 -top-24 size-[520px] rounded-full bg-brand-secondary/15 blur-[120px]" />
      <div className="absolute -bottom-40 right-[-10%] size-[460px] rounded-full bg-brand-secondary/10 blur-[120px]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_70%)]" />
    </div>

    <header className="relative flex items-center gap-3">
      {tenant?.logoUrl ? (
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg">
          <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full rounded-lg object-contain" />
        </div>
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-secondary text-brand-secondary-foreground shadow-lg">
          <Store className="size-6" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold tracking-tight text-white">{tenant ? tenant.name : 'POS Store'}</p>
        <p className="truncate text-xs text-zinc-500">{tenant ? `@${tenant.slug}` : 'Punto de venta e inventario'}</p>
      </div>
    </header>

    <div className="relative my-8 hidden animate-fade-up lg:block">
      {tenant ? (
        <>
          <LiveClock timezone={tenant.timezone} country={tenant.country} />
          <h1 className="mt-8 max-w-md text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">Terminal de cobro lista para tu turno.</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">Ventas, caja e inventario de tu sucursal en un solo lugar.</p>
        </>
      ) : (
        <>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.1] tracking-tight text-white xl:text-5xl">
            Tu negocio, <span className="text-brand-secondary">claro y bajo control</span>.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-400">Cobra, controla el inventario por sucursal y cierra caja sin cuadernos ni hojas de cálculo.</p>
          <ul className="mt-8 space-y-3 text-sm text-zinc-300">
            {['Ventas rápidas con teclado y lector de códigos', 'Inventario por variantes y varias sucursales', 'Arqueo de caja y reportes al instante'].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-secondary/20 text-brand-secondary">
                  <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3 3 7-7" /></svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>

    <div className="relative hidden items-end justify-between gap-6 lg:flex">
      <Showcase />
    </div>

    <footer className="relative mt-6 flex items-center justify-between text-xs text-zinc-500 lg:mt-0 lg:pt-6">
      <span className="flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
        Terminal lista
      </span>
      {tenant && onChangeTenant && (
        <button type="button" onClick={onChangeTenant} className="cursor-pointer font-medium text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline">
          Cambiar tienda
        </button>
      )}
    </footer>
  </aside>
);
