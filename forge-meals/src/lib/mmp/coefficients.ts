/**
 * Coefficients & base ratios ported from the linked Google Sheet
 * "Calculations (Backend Logic)" + MMP measurement regressions.
 * Female MMP measurement equations use the sheet's differentiated scaling
 * (applied as genderScale on the male Casey Butt regressions).
 */

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "athlete";

export type PhaseCycle = "cut" | "maintenance" | "bulk";
export type CycleStrategy = "conservative" | "aggressive";
export type Gender = "M" | "F";

export const ACTIVITY_MULTIPLIERS: Record<
  ActivityLevel,
  { label: string; description: string; examples: string; value: number }
> = {
  sedentary: {
    label: "Sedentary",
    description: "0 Sport",
    examples: "Sitting",
    value: 1.2,
  },
  light: {
    label: "Light",
    description: "Sports 2/3 days",
    examples: "Standing, Driving",
    value: 1.375,
  },
  moderate: {
    label: "Moderate",
    description: "Sport 4/5 days",
    examples: "Clean, Walk fast",
    value: 1.55,
  },
  active: {
    label: "Active",
    description: "Sport 6/7 days",
    examples: "Construction, Stairs",
    value: 1.725,
  },
  athlete: {
    label: "Athlete",
    description: "Sports 2h+/day, 7 days",
    examples: "Strength Jobs",
    value: 1.9,
  },
};

/** Phase cycle macro coefficients: g per kg body weight */
export const PHASE_MACRO_COEFFICIENTS: Record<
  PhaseCycle,
  { proteinPerKg: number; fatPerKg: number; bfGuidance: string }
> = {
  cut: { proteinPerKg: 1.8, fatPerKg: 1.1, bfGuidance: ">20%" },
  maintenance: { proteinPerKg: 1.6, fatPerKg: 1.15, bfGuidance: "12-15%" },
  bulk: { proteinPerKg: 1.8, fatPerKg: 1.2, bfGuidance: "<12%" },
};

export const MACRO_KCAL = { protein: 4, fat: 9, carbs: 4 } as const;

/** Weekly weight change strategy (% of BW / week for cuts; bulk studies) */
export const CYCLE_STRATEGY = {
  cut: {
    conservative: { weeklyWeightPct: 0.025, fatLossShare: 1.0 },
    aggressive: { weeklyWeightPct: 0.055, fatLossShare: 0.75 },
  },
  bulk: {
    conservative: { weeklyWeightGainPct: 0.2, lbmGainPct: 80 },
    aggressive: { weeklyWeightGainPct: 0.38, lbmGainPct: 66.5 },
  },
} as const;

/**
 * Golden ratios — empirical vs person-specific averages from the sheet.
 * Values used for progress comparison (average of the two methods).
 */
export const GOLDEN_RATIOS = {
  empirical: {
    chestWrist: 6.0,
    shoulderAbdomen: 1.2,
    armWrist: 2.3,
    thighKnee: 1.7,
    calfAnkle: 1.8,
    gluteAnkle: 5.75,
  },
  personSpecific: {
    chestWrist: 6.5,
    shoulderAbdomen: 1.3,
    armWrist: 2.5,
    thighKnee: 1.8,
    calfAnkle: 1.9,
    gluteAnkle: 6.25,
  },
} as const;

export function averageGoldenRatios() {
  const e = GOLDEN_RATIOS.empirical;
  const p = GOLDEN_RATIOS.personSpecific;
  return {
    chestWrist: (e.chestWrist + p.chestWrist) / 2,
    shoulderAbdomen: (e.shoulderAbdomen + p.shoulderAbdomen) / 2,
    armWrist: (e.armWrist + p.armWrist) / 2,
    thighKnee: (e.thighKnee + p.thighKnee) / 2,
    calfAnkle: (e.calfAnkle + p.calfAnkle) / 2,
    gluteAnkle: (e.gluteAnkle + p.gluteAnkle) / 2,
  };
}

/**
 * Casey Butt male measurement regressions (cm), using wrist, ankle, height.
 * Sheet applies ~0.83 LBM scale for female; measurement equations in the
 * linked sheet are already female-tuned for that profile. We expose both:
 * - genderScaleLbm: F=0.83, M=1.0 (matches sheet E9)
 * - measurementScale: optional group multipliers for male vs female
 */
export const MMP_LBM_GENDER_SCALE: Record<Gender, number> = {
  M: 1.0,
  F: 0.83,
};

/** Female upper-body mild reductions relative to male (sheet notes ≈0.80–0.90×) */
export const MMP_MEASUREMENT_GENDER_SCALE: Record<
  Gender,
  Record<
    | "chest"
    | "shoulder"
    | "neck"
    | "upperArm"
    | "foreArm"
    | "thigh"
    | "calf"
    | "glutes",
    number
  >
> = {
  M: {
    chest: 1,
    shoulder: 1,
    neck: 1,
    upperArm: 1,
    foreArm: 1,
    thigh: 1,
    calf: 1,
    glutes: 1,
  },
  // Sheet MMP values for F already match the raw regressions below —
  // keep 1.0 when using the sheet equations as authored.
  F: {
    chest: 1,
    shoulder: 1,
    neck: 1,
    upperArm: 1,
    foreArm: 1,
    thigh: 1,
    calf: 1,
    glutes: 1,
  },
};

/** Linear regression coefficients from sheet MMP!I12:I19 */
export const MMP_MEASUREMENT_COEFFS = {
  chest: { wrist: 1.34875, ankle: 1.135606, height: 0.295646, intercept: 0 },
  shoulder: { wrist: 4.25, ankle: 3.48, height: 0.401, intercept: -92.74 },
  neck: { wrist: 1.06875, ankle: 0, height: 0.11709, intercept: 0 },
  upperArm: { wrist: 0.971847, ankle: 0, height: 0.11205, intercept: 0 },
  foreArm: { wrist: 0.7885, ankle: 0, height: 0.086403, intercept: 0 },
  thigh: { wrist: 0, ankle: 1.355804, height: 0.176456, intercept: 0 },
  calf: { wrist: 0, ankle: 0.902704, height: 0.115, intercept: 0 },
  glutes: { wrist: 0, ankle: 2.576028, height: 0.335266, intercept: 0 },
} as const;

export const KCAL_PER_KG_FAT = 3500 * 0.453592; // ~1588 kcal
export const REALISTIC_MMP_CORRECTION = 0.95;
export const MAINTENANCE_KCAL_PER_KG = 22;
