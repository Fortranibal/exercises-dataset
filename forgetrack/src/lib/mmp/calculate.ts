import {
  ACTIVITY_MULTIPLIERS,
  averageGoldenRatios,
  CYCLE_STRATEGY,
  Gender,
  KCAL_PER_KG_FAT,
  MACRO_KCAL,
  MAINTENANCE_KCAL_PER_KG,
  MMP_LBM_GENDER_SCALE,
  MMP_MEASUREMENT_COEFFS,
  MMP_MEASUREMENT_GENDER_SCALE,
  PHASE_MACRO_COEFFICIENTS,
  PhaseCycle,
  CycleStrategy,
  ActivityLevel,
  REALISTIC_MMP_CORRECTION,
} from "./coefficients";

export type BodyInputs = {
  heightCm: number;
  weightKg: number;
  wristCm: number;
  ankleCm: number;
  kneeCm: number;
  bodyFatPct: number;
  gender: Gender;
  activity: ActivityLevel;
  phase: PhaseCycle;
  strategy: CycleStrategy;
};

export type MeasurementSnapshot = {
  neck?: number | null;
  abdomen?: number | null;
  shoulders?: number | null;
  chest?: number | null;
  upperArm?: number | null;
  foreArm?: number | null;
  thigh?: number | null;
  calf?: number | null;
  glutes?: number | null;
};

function leanBodyMass(weightKg: number, bodyFatPct: number): number {
  return weightKg * (1 - bodyFatPct / 100);
}

/**
 * Deurenberg adult body-fat estimate from BMI, age, and sex.
 * Used when BF isn't logged from calipers / DEXA elsewhere.
 * Sex: 1 = male, 0 = female.
 */
export function estimateBodyFatPct(input: {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
}): number {
  const hM = Math.max(0.5, input.heightCm / 100);
  const bmi = input.weightKg / (hM * hM);
  const sex = input.gender === "M" ? 1 : 0;
  const bf = 1.2 * bmi + 0.23 * input.age - 10.8 * sex - 5.4;
  return Math.round(Math.max(5, Math.min(55, bf)) * 10) / 10;
}

/** Simple heuristic: height(cm) − 100 */
export function simpleMaxLbmKg(heightCm: number): number {
  return heightCm - 100;
}

/**
 * Casey Butt max LBM (kg) — matches sheet formula E9:
 * genderScale * (H_in^1.5) * (√W_in/22.667 + √A_in/17.0104) * (BF/224+1) * 0.453592
 */
export function caseyButtMaxLbmKg(input: {
  heightCm: number;
  wristCm: number;
  ankleCm: number;
  bodyFatPct: number;
  gender: Gender;
}): number {
  const hIn = input.heightCm * 0.393701;
  const wIn = input.wristCm * 0.393701;
  const aIn = input.ankleCm * 0.393701;
  const scale = MMP_LBM_GENDER_SCALE[input.gender];
  const lbs =
    scale *
    hIn ** 1.5 *
    (Math.sqrt(wIn) / 22.667 + Math.sqrt(aIn) / 17.0104) *
    (input.bodyFatPct / 224 + 1);
  return lbs * 0.453592;
}

export function maxMeasurementsCm(input: {
  heightCm: number;
  wristCm: number;
  ankleCm: number;
  gender: Gender;
}) {
  const scale = MMP_MEASUREMENT_GENDER_SCALE[input.gender];
  const { heightCm: h, wristCm: w, ankleCm: a } = input;
  const out: Record<keyof typeof MMP_MEASUREMENT_COEFFS, number> = {
    chest: 0,
    shoulder: 0,
    neck: 0,
    upperArm: 0,
    foreArm: 0,
    thigh: 0,
    calf: 0,
    glutes: 0,
  };
  for (const key of Object.keys(MMP_MEASUREMENT_COEFFS) as Array<
    keyof typeof MMP_MEASUREMENT_COEFFS
  >) {
    const c = MMP_MEASUREMENT_COEFFS[key];
    out[key] =
      scale[key] *
      (c.wrist * w + c.ankle * a + c.height * h + c.intercept);
  }
  return out;
}

export function computeMacros(input: BodyInputs) {
  const coeffs = PHASE_MACRO_COEFFICIENTS[input.phase];
  const maintenanceBase = input.weightKg * MAINTENANCE_KCAL_PER_KG;
  const realExpenditure =
    maintenanceBase * ACTIVITY_MULTIPLIERS[input.activity].value;

  let targetKcal = realExpenditure;
  if (input.phase === "cut") {
    const strat = CYCLE_STRATEGY.cut[input.strategy];
    const weeklyFatKg = input.weightKg * (strat.weeklyWeightPct / 100);
    targetKcal = realExpenditure - weeklyFatKg * KCAL_PER_KG_FAT;
  } else if (input.phase === "bulk") {
    // ~surplus aligned to conservative/aggressive weekly gain (~0.2–0.38% BW)
    const gainPct =
      CYCLE_STRATEGY.bulk[input.strategy].weeklyWeightGainPct / 100;
    const weeklyGainKg = input.weightKg * gainPct;
    targetKcal = realExpenditure + weeklyGainKg * KCAL_PER_KG_FAT * 0.7;
  }

  const proteinG = coeffs.proteinPerKg * input.weightKg;
  const fatG = coeffs.fatPerKg * input.weightKg;
  const proteinKcal = proteinG * MACRO_KCAL.protein;
  const fatKcal = fatG * MACRO_KCAL.fat;
  const carbKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
  const carbsG = carbKcal / MACRO_KCAL.carbs;

  return {
    maintenanceBase,
    realExpenditure: Math.round(realExpenditure),
    targetKcal: Math.round(targetKcal),
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.round(carbsG),
    weeklyDeltaKg: (targetKcal - realExpenditure) / 1000,
  };
}

export function computeMmp(input: BodyInputs, current?: MeasurementSnapshot) {
  const simple = simpleMaxLbmKg(input.heightCm);
  const casey = caseyButtMaxLbmKg(input);
  const avgMax = (simple + casey) / 2;
  const currentLbm = leanBodyMass(input.weightKg, input.bodyFatPct);
  const remaining = Math.max(0, avgMax - currentLbm);
  const realisticMax = avgMax * REALISTIC_MMP_CORRECTION;
  const measurements = maxMeasurementsCm(input);
  const golden = averageGoldenRatios();

  const progress = {
    chest: current?.chest != null ? current.chest / measurements.chest : null,
    shoulder:
      current?.shoulders != null
        ? current.shoulders / measurements.shoulder
        : null,
    neck: current?.neck != null ? current.neck / measurements.neck : null,
    upperArm:
      current?.upperArm != null
        ? current.upperArm / measurements.upperArm
        : null,
    foreArm:
      current?.foreArm != null ? current.foreArm / measurements.foreArm : null,
    thigh: current?.thigh != null ? current.thigh / measurements.thigh : null,
    calf: current?.calf != null ? current.calf / measurements.calf : null,
    glutes:
      current?.glutes != null ? current.glutes / measurements.glutes : null,
  };

  const ratios = {
    chestWrist:
      current?.chest != null ? current.chest / input.wristCm : null,
    shoulderAbdomen:
      current?.shoulders != null && current?.abdomen != null
        ? current.shoulders / current.abdomen
        : null,
    armWrist:
      current?.upperArm != null ? current.upperArm / input.wristCm : null,
    thighKnee:
      current?.thigh != null ? current.thigh / input.kneeCm : null,
    calfAnkle:
      current?.calf != null ? current.calf / input.ankleCm : null,
    gluteAnkle:
      current?.glutes != null ? current.glutes / input.ankleCm : null,
  };

  return {
    simpleMaxLbmKg: round2(simple),
    caseyMaxLbmKg: round2(casey),
    avgMaxLbmKg: round2(avgMax),
    realisticMaxLbmKg: round2(realisticMax),
    currentLbmKg: round2(currentLbm),
    remainingLbmKg: round2(remaining),
    measurements: mapRound2(measurements),
    progress,
    ratios,
    goldenTargets: golden,
    macros: computeMacros(input),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function mapRound2<T extends Record<string, number>>(obj: T): T {
  const out = { ...obj };
  for (const k of Object.keys(out) as Array<keyof T>) {
    out[k] = round2(out[k] as number) as T[keyof T];
  }
  return out;
}
