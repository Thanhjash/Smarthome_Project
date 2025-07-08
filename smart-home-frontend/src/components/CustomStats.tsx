import React from 'react';
import { Stat as ChakraStat, StatLabel, StatNumber, StatHelpText, StatArrow } from '@chakra-ui/react';

interface CustomStatProps {
  label: string;
  number: number | string;
  helpText?: string;
  arrowType?: 'increase' | 'decrease';
  showArrow?: boolean;
}

export const CustomStat: React.FC<CustomStatProps> = ({
  label,
  number,
  helpText,
  arrowType = 'increase',
  showArrow = true
}) => {
  return (
    <ChakraStat>
      <StatLabel>{label}</StatLabel>
      <StatNumber>{number}</StatNumber>
      <StatHelpText>
        {showArrow && <StatArrow type={arrowType} />}
        {helpText}
      </StatHelpText>
    </ChakraStat>
  );
};
