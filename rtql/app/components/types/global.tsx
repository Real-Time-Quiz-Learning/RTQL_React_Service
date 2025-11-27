export interface SVGProps extends React.SVGProps<SVGSVGElement> {}

export interface FeatureCardProps {
  icon: React.ElementType<SVGProps>;
  title: string;
  description: string;
}

export interface ModelQuestion {
  question: string;
  options: Array<string>;
  correct: number;
}

export interface QuestionResponse {
  id: number;
  qid: number;
  rtext: string;
  correct: boolean;
}

export interface Question {
  id: number;
  qtext: string;
  responses: Array<QuestionResponse>;
  publishedId?: number;
  active?: boolean;
  timestamp?: string;
  isEdited?: boolean;
  publishedAt?: Date;
  isPersisted?: boolean;
}

export interface RtqlMessage {
    message: string;
    type: 'info' | 'warning' | 'error';
}

export interface EndpointStats {
  endpoint: string;
  methods: Record<string, number>;
}

export interface UserStats {
  id: number | string;
  email: string;
  totalRequests: number;
}

export interface AdminStats {
  endpointStats: EndpointStats[];
  userStats: UserStats[];
  totalRequests: number;
}
