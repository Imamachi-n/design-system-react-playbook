import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["contained", "outlined", "text"],
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "error", "warning", "info", "success"],
    },
    disabled: {
      control: "boolean",
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Contained: Story = {
  args: {
    children: "Button",
    variant: "contained",
  },
};

export const Outlined: Story = {
  args: {
    children: "Button",
    variant: "outlined",
  },
};

export const Text: Story = {
  args: {
    children: "Button",
    variant: "text",
  },
};

export const Small: Story = {
  args: {
    children: "Small",
    size: "small",
  },
};

export const Large: Story = {
  args: {
    children: "Large",
    size: "large",
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};
