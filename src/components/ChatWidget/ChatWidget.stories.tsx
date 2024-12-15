import type { Meta, StoryObj } from '@storybook/react'
import { ChatWidget } from './index'

const meta: Meta<typeof ChatWidget> = {
  title: 'Components/ChatWidget',
  component: ChatWidget,
  parameters: {
    layout: 'centered'
  },
  args: {
    businessId: 'test-business',
    apiUrl: 'http://localhost:8787'
  }
}

export default meta
type Story = StoryObj<typeof ChatWidget>

export const Default: Story = {}

export const CustomTheme: Story = {
  args: {
    theme: {
      primaryColor: '#4CAF50',
      backgroundColor: '#f5f5f5',
      textColor: '#333333'
    }
  }
}
