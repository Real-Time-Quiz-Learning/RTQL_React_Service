import type { FeatureCardProps } from '../types/global';
import ZapIcon from "../icons/ZapIcon"
import UsersIcon from "../icons/UserIcon"
import BarChartIcon from "../icons/BarChartIcon"
import ClockIcon from "../icons/ClockIcon"

export const featuredata: FeatureCardProps[] = [
  {
    icon: ZapIcon,
    title: "Instant Feedback",
    description: "Get immediate results and explanations after every question to solidify your learning in real-time.",
  },
  {
    icon: UsersIcon,
    title: "Collaborative Quizzes",
    description: "Challenge friends or classmates in live quiz sessions and climb the global leaderboards.",
  },
  {
    icon: BarChartIcon,
    title: "Performance Analytics",
    description: "Track your progress, identify knowledge gaps, and focus your study on weak areas with smart reports.",
  },
  {
    icon: ClockIcon,
    title: "Time-Based Challenges",
    description: "Master time pressure with quick-fire rounds designed to boost both accuracy and recall speed.",
  },
];
