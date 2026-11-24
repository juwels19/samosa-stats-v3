export interface StatboticsMatchResult {
  key: string;
  year: number;
  event: string;
  week: number;
  elim: boolean;
  comp_level: string;
  set_number: number;
  match_number: number;
  match_name: string;
  time: number;
  predicted_time: number;
  status: string;
  video: string;
  alliances: {
    red: {
      team_keys: number[];
      surrogate_team_keys: number[];
      dq_team_keys: number[];
    },
    blue: {
      team_keys: number[];
      surrogate_team_keys: number[];
      dq_team_keys: number[];
    }
  },
  pred: {
    winner: 'blue' | 'red';
    red_win_prob: number;
    red_score: number;
    blue_score: number;
    red_energized_rp: number;
    blue_energized_rp: number;
    red_supercharged_rp: number;
    blue_supercharged_rp: number;
    red_traversal_rp: number;
    blue_traversal_rp: number;
    red_rp_1: number;
    blue_rp_1: number;
    red_rp_2: number;
    blue_rp_2: number;
    red_rp_3: number;
    blue_rp_3: number;
  },
  result: {
    winner: "blue" | "red",
    red_score: number;
    blue_score: number;
    red_no_foul: number;
    blue_no_foul: number;
    red_auto_points: number;
    blue_auto_points: number;
    red_teleop_points: number;
    blue_teleop_points: number;
    red_endgame_points: number;
    blue_endgame_points: number;
    red_energized_rp: boolean;
    blue_energized_rp: boolean;
    red_supercharged_rp: boolean;
    blue_supercharged_rp: boolean;
    red_traversal_rp: boolean;
    blue_traversal_rp: boolean;
    blue_auto_fuel: number;
    red_auto_tower: number;
    blue_auto_tower: number;
    red_transition_fuel: number;
    blue_transition_fuel: number;
    red_first_shift_fuel: number;
    blue_first_shift_fuel: number;
    red_second_shift_fuel: number;
    blue_second_shift_fuel: number;
    red_teleop_fuel: number;
    blue_teleop_fuel: number;
    red_endgame_fuel: number;
    blue_endgame_fuel: number;
    red_endgame_tower: number;
    blue_endgame_tower: number;
    red_total_fuel: number;
    blue_total_fuel: number;
    red_total_tower: number;
    blue_total_tower: number;
    red_rp_1: boolean,
    blue_rp_1: boolean;
    red_rp_2: boolean;
    blue_rp_2: boolean;
    red_rp_3: boolean;
    blue_rp_3: boolean;
  }
}

export interface StatboticsTeamEventResult {
  team: number;
  year: number;
  event: string;
  time: number;
  team_name: string;
  event_name: string;
  country: string;
  state: string;
  district: string;
  type: string;
  week: number;
  status: string;
  first_event: boolean;
  epa: {
    total_points: {
      mean: number;
      sd: number;
    },
    unitless: number;
    norm: number;
    conf: number[];
    breakdown: {
      total_points: number;
      auto_points: number;
      teleop_points: number;
      endgame_points: number;
      energized_rp: number;
      supercharged_rp: number;
      traversal_rp: number;
      tiebreaker_points: number;
      auto_fuel: number;
      auto_tower: number;
      transition_fuel: number;
      first_shift_fuel: number;
      second_shift_fuel: number;
      teleop_fuel: number;
      endgame_fuel: number;
      endgame_tower: number;
      total_fuel: number;
      total_tower: number;
      rp_1: number;
      rp_2: number;
      rp_3: number;
    },
    stats: {
      start: number;
      pre_elim: number;
      mean: number;
      max: number;
    }
  },
  record: {
    qual: {
      wins: number;
      losses: number;
      ties: number;
      count: number;
      winrate: number;
      rps: number;
      rps_per_match: number;
      rank: number;
      num_teams: number;
    },
    elim: {
      wins: number;
      losses: number;
      ties: number;
      count: number;
      winrate: number;
      alliance: null;
      is_captain: null;
    },
    total: {
      wins: number;
      slosses: number;
      ties: number;
      count: number;
      winrate: number;
    }
  },
  district_points: number;
}