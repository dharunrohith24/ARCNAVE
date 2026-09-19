export type Prediction = {
  prediction: "CONFIRMED" | "FALSE POSITIVE";
  prediction_int: number;
  confirmed_probability: number;
  false_positive_probability: number;
};

export type Candidate = {
  kepid: string;
  original_status: string;
  ai_prediction: "CONFIRMED" | "FALSE POSITIVE";
  confirmed_probability: number;
};

export type CandidatePage = {
  items: Candidate[];
  total: number;
  page: number;
  page_size: number;
};

export type Analytics = {
  total_observations: number;
  disposition: Record<string, number>;
  ai_classification: Record<string, number>;
  probability_bands: { label: string; count: number }[];
  ai_confirmed: number;
  ai_false_positive: number;
};

export type Observation = {
  koi_period: string;
  koi_time0bk: string;
  koi_duration: string;
  koi_depth: string;
  koi_prad: string;
  koi_model_snr: string;
  koi_steff: string;
  koi_srad: string;
  koi_kepmag: string;
};