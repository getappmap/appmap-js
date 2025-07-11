import { Meta, StoryObj } from '@storybook/vue';

import ReviewStatus from '@/components/review/ReviewStatus.vue';

const meta: Meta<typeof ReviewStatus> = {
  title: 'Review/ReviewStatus',
  component: ReviewStatus,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ReviewStatus>;

export const Default: Story = {};
