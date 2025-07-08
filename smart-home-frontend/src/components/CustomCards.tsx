import { Card as ChakraCard, CardHeader, CardBody, CardFooter, Heading, Text, Button, Box } from '@chakra-ui/react';
import { CustomStat } from './CustomStats';

const CustomCard = ({ title, bodyText, buttonText, statProps, icon, CustomSize }) => {
  return (
    <ChakraCard bg='white' color='black' boxShadow="2xl">
      <CardHeader display="flex" alignItems="center">
        {icon && <Box as={icon} mr={2} size='30px' />}
        <Heading size='md'>{title}</Heading>
      </CardHeader>
      <CardBody>
        <Text fontSize={CustomSize}>{bodyText}</Text>
        <CustomStat {...statProps}/>
      </CardBody>
      <CardFooter>
        <Button colorScheme='teal' variant='solid'>{buttonText}</Button>
      </CardFooter>
    </ChakraCard>
  );
};

export default CustomCard;
