import { recipe } from "@vanilla-extract/recipes";
import { colors } from "../../tokens/colors.css";
import { spacing } from "../../tokens/spacing.css";
import { typography } from "../../tokens/typography.css";

export const button = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
    cursor: "pointer",
    border: "none",
    transition: "background-color 0.15s ease, box-shadow 0.15s ease",
    ":focus-visible": {
      outline: "2px solid",
      outlineColor: colors.primary[500],
      outlineOffset: "2px",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: colors.primary[600],
        color: colors.white,
        ":hover": {
          backgroundColor: colors.primary[700],
        },
      },
      secondary: {
        backgroundColor: colors.neutral[200],
        color: colors.neutral[800],
        ":hover": {
          backgroundColor: colors.neutral[300],
        },
      },
      ghost: {
        backgroundColor: "transparent",
        color: colors.neutral[700],
        ":hover": {
          backgroundColor: colors.neutral[100],
        },
      },
    },
    size: {
      sm: {
        fontSize: typography.fontSize.sm,
        padding: `${spacing[1]} ${spacing[3]}`,
        height: "32px",
      },
      md: {
        fontSize: typography.fontSize.base,
        padding: `${spacing[2]} ${spacing[4]}`,
        height: "40px",
      },
      lg: {
        fontSize: typography.fontSize.lg,
        padding: `${spacing[3]} ${spacing[6]}`,
        height: "48px",
      },
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});
