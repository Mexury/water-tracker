export type Unit = 'ml' | 'oz';

const ML_PER_OZ = 29.5735;

export function formatVolume(ml: number, unit: Unit): string {
  if (unit === 'oz') return `${Math.round(ml / ML_PER_OZ)} oz`;
  return ml >= 1000 && ml % 100 === 0 ? `${(ml / 1000).toFixed(1)} L` : `${Math.round(ml)} ml`;
}

/** Number only, for big headline figures. */
export function formatAmount(ml: number, unit: Unit): string {
  return unit === 'oz' ? String(Math.round(ml / ML_PER_OZ)) : Math.round(ml).toLocaleString('en-US');
}
