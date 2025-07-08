import { extendTheme } from '@chakra-ui/react';
import { switchTheme } from '@/components/SwitchTheme';
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'black',
      },
    },
  },
  fonts: {
    heading: "'M PLUS Rounded 1c'"
  },
  components: { Switch: switchTheme },
});

export default theme;
