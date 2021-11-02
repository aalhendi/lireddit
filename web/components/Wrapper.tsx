import { Box } from "@chakra-ui/react";
import React from "react";

export type WrapperVariant = "small" | "regular";

interface WrapperProps {
  variant?: WrapperVariant;
}

const Wrapper: React.FC<WrapperProps> = ({ children, variant = "regular" }) => {
  const mapVariant = (variant: string) => {
    switch (variant) {
      case "regular":
        return "800px";
      case "small":
        return "400px";
      default:
        console.error("Invalid variant selected.");
        break;
    }
  };
  return (
    <Box mt={8} mx="auto" maxW={mapVariant(variant)} w="100%">
      {children}
    </Box>
  );
};

export default Wrapper;
