/** Estado de la carga del resumen de un turno: sin él no se muestran importes (nunca ceros inventados). */
export type ClosingDetailsStatus = 'loading' | 'ready' | 'unavailable';
