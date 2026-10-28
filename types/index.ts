export type TicketStatus =
  | 'draft'
  | 'submitted'
  | 'matching'
  | 'assigned'
  | 'claimed'
  | 'answered'
  | 'resolved';

export type AssignmentStatus =
  | 'pending'
  | 'claimed'
  | 'declined'
  | 'expired';

export interface RouteTicketRequest {
  institution_id: string;
  programme_id: string;
  requested_year: number;
  topic: string;
  question: string;
}

export interface RouteTicketResponse {
  success: boolean;
  message: string;
  ticket: {
    id: string;
    topic: string;
    status: TicketStatus;
    institution_id: string;
    programme_id: string;
    requested_year: number;
    created_at: string;
  };
  assignment: {
    assigned: boolean;
    status: AssignmentStatus | null;
  };
}

export interface CollegeRecommendation {
  collegeName: string;
  branch: string;
  type: 'Public' | 'Private';
  feasibility: 'Safe' | 'Competitive' | 'Borderline';
  aiMatchScore: number;
  holisticReview: string;
}
