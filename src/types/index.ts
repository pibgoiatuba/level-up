export interface Member {
  email: string;
  name: string;
  photoUrl: string;
  totalXp: number;
  weeklyXp?: number;
}

export interface Submission {
  date: string;
  email: string;
  challenge: string;
  xpEarned: number;
}
