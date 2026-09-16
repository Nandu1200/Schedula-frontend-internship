export type Doctor = {
  id: string;

  name: string;

  specialty: string;

  qualification: string;

  experienceYears: number;

  email: string;

  phone: string;

  hospital: string;

  location: string;

  consultationFee: number;

  onlineFee: number;

  inPersonFee: number;

  bio: string;

  avatarUrl?: string;
};