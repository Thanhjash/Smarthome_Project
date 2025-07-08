import { switchAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(switchAnatomy.keys)

const baseStyle = definePartsStyle({
  thumb: {
    bg: 'blue.300',
  },
  track: {
    bg: 'gray.100',
    _checked: {
      bg: 'blue.100',
    },
  },
})

export const switchTheme = defineMultiStyleConfig({ baseStyle })