export interface SVGProps extends React.SVGProps<SVGSVGElement> {}

export interface FeatureCardProps {
  icon: React.ElementType<SVGProps>;
  title: string;
  description: string;
}
